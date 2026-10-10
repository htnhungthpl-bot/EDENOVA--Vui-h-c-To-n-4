/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { AuditService } from '../services/audit-service.ts';
import { sensitiveAdminRateLimiter } from '../middleware/rate-limiter.ts';
import { DataStore } from '../db/data-store.ts';
import { SchemaValidator } from '../db/schema-validator.ts';
import { UserStore } from '../services/user-store.ts';

const router = Router();

// Toàn bộ route admin yêu cầu xác thực và quyền SUPER_ADMIN
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));
router.use(sensitiveAdminRateLimiter.getMiddleware());

/**
 * GET /api/admin/schools
 * Danh sách trường học (Có phân trang)
 */
router.get('/schools', (req: AuthenticatedRequest, res: Response): void => {
  const { page, limit } = SchemaValidator.parsePagination(req.query);
  const status = req.query.status as 'ACTIVE' | 'LOCKED' | undefined;

  const allSchools = DataStore.getSchools({ status });
  const paginated = DataStore.paginate(allSchools, page, limit);

  res.json({
    success: true,
    ...paginated,
  });
});

/**
 * POST /api/admin/schools
 * Tạo trường học mới (Có kiểm tra schema validation)
 */
router.post('/schools', (req: AuthenticatedRequest, res: Response): void => {
  const errors = SchemaValidator.validateCreateSchool(req.body);
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Dữ liệu đầu vào không hợp lệ.',
      details: errors,
    });
    return;
  }

  try {
    const school = DataStore.createSchool(req.body);

    AuditService.record({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: 'SUPER_ADMIN',
      action: 'CREATE_SCHOOL',
      targetType: 'SCHOOL',
      targetId: school.id,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: { schoolCode: school.code, schoolName: school.name },
    });

    res.status(201).json({
      success: true,
      message: `Đã tạo trường học [${school.name}] thành công.`,
      school,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo trường học';
    res.status(400).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/admin/schools/:schoolId/status
 * Khóa hoặc Mở khóa trường học
 */
router.patch('/schools/:schoolId/status', (req: AuthenticatedRequest, res: Response): void => {
  const { schoolId } = req.params;
  const { status, reason } = req.body;

  if (!['ACTIVE', 'LOCKED'].includes(status)) {
    res.status(400).json({
      success: false,
      error: 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc LOCKED.',
    });
    return;
  }

  try {
    const updated = DataStore.updateSchoolStatus(schoolId, status, reason);

    AuditService.record({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: 'SUPER_ADMIN',
      action: status === 'LOCKED' ? 'LOCK_SCHOOL' : 'UNLOCK_SCHOOL',
      targetType: 'SCHOOL',
      targetId: schoolId,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: { status, reason },
    });

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái trường [${updated.name}] thành [${status}].`,
      school: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trường';
    res.status(404).json({ success: false, error: msg });
  }
});

/**
 * POST /api/admin/school-admins
 * Tạo tài khoản Quản trị viên Trường học (SCHOOL_ADMIN)
 */
router.post('/school-admins', (req: AuthenticatedRequest, res: Response): void => {
  const errors = SchemaValidator.validateCreateSchoolAdmin(req.body);
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Dữ liệu tài khoản quản trị trường không hợp lệ.',
      details: errors,
    });
    return;
  }

  const { email, name, password, schoolId } = req.body;

  const school = DataStore.getSchoolById(schoolId);
  if (!school) {
    res.status(404).json({
      success: false,
      error: `Không tìm thấy trường học có ID [${schoolId}].`,
    });
    return;
  }

  try {
    const uid = 'sch_adm_' + Date.now();
    const user = UserStore.createUser({
      uid,
      email,
      name,
      password,
      role: 'SCHOOL_ADMIN',
      schoolId,
    });

    AuditService.record({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: 'SUPER_ADMIN',
      action: 'CREATE_SCHOOL_ADMIN',
      targetType: 'USER',
      targetId: user.uid,
      schoolId,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: { adminEmail: email, schoolCode: school.code },
    });

    res.status(201).json({
      success: true,
      message: `Đã tạo tài khoản Quản trị viên trường [${school.name}] thành công.`,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo tài khoản';
    res.status(400).json({ success: false, error: msg });
  }
});

/**
 * GET /api/admin/audit-logs
 * Xem nhật ký kiểm toán toàn hệ thống (Có phân trang)
 */
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response): void => {
  const actor = req.user!;
  const { page, limit } = SchemaValidator.parsePagination(req.query);
  const schoolId = req.query.schoolId as string | undefined;

  const allLogs = AuditService.query({
    requesterRole: actor.role,
    requesterSchoolId: actor.schoolId,
    targetSchoolId: schoolId,
    limit: 500,
  });

  const paginated = DataStore.paginate(allLogs, page, limit);

  res.json({
    success: true,
    logs: paginated.items,
    ...paginated,
  });
});

/**
 * GET /api/admin/ai-costs
 * Theo dõi chi phí và hạn mức sử dụng Gemini API của nền tảng
 */
router.get('/ai-costs', (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    data: {
      totalTokensConsumed: 0,
      totalPrompts: 0,
      estimatedCostUsd: 0.0,
      costStatus: 'Chưa có dữ liệu tiêu thụ thực tế',
      quotaRemaining: '100%',
      rateLimits: {
        geminiFlashRpm: 15,
        geminiFlashTpm: 1000000,
      },
      note: 'Dữ liệu đo lường trực tiếp từ máy chủ proxy khi có phiên tương tác thật.',
    },
  });
});

/**
 * GET /api/admin/config
 */
router.get('/config', (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    config: {
      platformName: 'EDUNOVA',
      activeCurriculum: 'GDPT 2018 - Toán 4',
      enforceRuleGrading: true,
      dataMinimizationMode: true,
      coppaCompliant: true,
      supportedRoles: [
        'SUPER_ADMIN',
        'SCHOOL_ADMIN',
        'TEACHER',
        'STUDENT',
        'CONTENT_REVIEWER',
      ],
    },
  });
});

export default router;
