/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  requireTeacherClassAccess,
  requireSchoolAccess,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { ReportingService } from '../services/reporting-service.ts';
import { AuditService } from '../services/audit-service.ts';
import { SchemaValidator } from '../db/schema-validator.ts';
import { DataStore } from '../db/data-store.ts';

const router = Router();

router.use(authenticate);

// ===========================================================================
// 1. BÁO CÁO GIÁO VIÊN (TEACHER REPORT - CHỈ LỚP ĐƯỢC PHÂN CÔNG)
// ===========================================================================

/**
 * GET /api/reports/class/:classId
 * Báo cáo tổng quan của lớp (Chỉ giáo viên được phân công hoặc Admin trường/tổng)
 */
router.get(
  '/class/:classId',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requireTeacherClassAccess('classId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { classId } = req.params;
    const report = ReportingService.getClassReport(classId);

    res.json({
      success: true,
      report,
    });
  }
);

/**
 * GET /api/reports/class/:classId/export-csv
 * Xuất dữ liệu bảng điểm và học sinh cần hỗ trợ ra CSV
 * BẮT BUỘC KIỂM TRA QUYỀN VÀ GHI NHẬN AUDIT LOGS
 */
router.get(
  '/class/:classId/export-csv',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requireTeacherClassAccess('classId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { classId } = req.params;

    const csvContent = ReportingService.exportClassReportCsv(classId);

    // Ghi nhật ký kiểm toán bắt buộc
    AuditService.record({
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'EXPORT_CLASS_REPORT_CSV',
      targetType: 'CLASS',
      targetId: classId,
      schoolId: actor.schoolId,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: { classId, fileSize: csvContent.length },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-lop-${classId}.csv"`);
    res.send(csvContent);
  }
);

// ===========================================================================
// 2. BÁO CÁO TRƯỜNG HỌC (SCHOOL REPORT - TRONG PHẠM VI TRƯỜNG)
// ===========================================================================

/**
 * GET /api/reports/school/:schoolId
 * Báo cáo tổng hợp trường học (SCHOOL_ADMIN hoặc SUPER_ADMIN)
 */
router.get(
  '/school/:schoolId',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId } = req.params;
    const report = ReportingService.getSchoolReport(schoolId);

    res.json({
      success: true,
      report,
    });
  }
);

/**
 * GET /api/reports/school/:schoolId/export-csv
 * Xuất dữ liệu báo cáo trường ra CSV
 * BẮT BUỘC KIỂM QUYỀN VÀ GHI AUDIT LOGS
 */
router.get(
  '/school/:schoolId/export-csv',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { schoolId } = req.params;

    const csvContent = ReportingService.exportSchoolReportCsv(schoolId);

    AuditService.record({
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'EXPORT_SCHOOL_REPORT_CSV',
      targetType: 'SCHOOL',
      targetId: schoolId,
      schoolId,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: { schoolId, fileSize: csvContent.length },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-truong-${schoolId}.csv"`);
    res.send(csvContent);
  }
);

// ===========================================================================
// 3. BÁO CÁO QUẢN TRỊ TỔNG (SUPER ADMIN REPORT)
// ===========================================================================

/**
 * GET /api/reports/admin/overview
 * Báo cáo tổng quan nền tảng, tình trạng dịch vụ, tài khoản hoạt động và chi phí AI
 */
router.get(
  '/admin/overview',
  requireRole('SUPER_ADMIN'),
  (_req: AuthenticatedRequest, res: Response): void => {
    const report = ReportingService.getSuperAdminReport();
    res.json({
      success: true,
      report,
    });
  }
);

/**
 * POST /api/reports/admin/ai-pricing
 * Cấu hình đơn giá token AI và tỷ giá quy đổi
 */
router.post(
  '/admin/ai-pricing',
  requireRole('SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const updated = ReportingService.updatePricingConfig(req.body);

    AuditService.record({
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'UPDATE_AI_PRICING_CONFIG',
      targetType: 'SYSTEM',
      targetId: 'ai_pricing',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: updated,
    });

    res.json({
      success: true,
      message: 'Đã cập nhật công thức và đơn giá tính toán chi phí AI.',
      pricingConfig: updated,
    });
  }
);

/**
 * GET /api/reports/admin/audit-logs
 * Nhật ký thao tác quan trọng có phân trang chuẩn phía backend
 */
router.get(
  '/admin/audit-logs',
  requireRole('SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { page, limit } = SchemaValidator.parsePagination(req.query);
    const action = req.query.action as string | undefined;
    const status = req.query.status as 'SUCCESS' | 'FAILURE' | undefined;
    const actorRole = req.query.actorRole as any;

    let allLogs = AuditService.query({
      requesterRole: 'SUPER_ADMIN',
      limit: 1000,
    });

    if (action) {
      allLogs = allLogs.filter((l) => l.action.includes(action));
    }
    if (status) {
      allLogs = allLogs.filter((l) => l.status === status);
    }
    if (actorRole) {
      allLogs = allLogs.filter((l) => l.actorRole === actorRole);
    }

    const paginated = DataStore.paginate(allLogs, page, limit);

    res.json({
      success: true,
      logs: paginated.items,
      pagination: {
        page: paginated.page,
        limit: paginated.limit,
        totalItems: paginated.total,
        totalPages: paginated.totalPages,
        hasMore: paginated.hasNext,
      },
    });
  }
);

export default router;
