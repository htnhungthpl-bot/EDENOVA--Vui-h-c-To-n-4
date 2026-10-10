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
import { CurriculumStore } from '../db/curriculum-store.ts';
import { GeminiService } from '../services/gemini-service.ts';
import { AiConfigStore } from '../services/ai-config-store.ts';
import { AuditService } from '../services/audit-service.ts';
import { AiRequestType } from '../../src/types/ai.ts';

const router = Router();

/**
 * GET /api/ai/status
 * Kiểm tra trạng thái AI và thông tin hạn mức (không lộ khóa API)
 */
router.get('/status', (req: AuthenticatedRequest, res: Response): void => {
  const config = AiConfigStore.getConfig();

  // Kiểm tra token xác thực nếu có truyền lên header
  const authHeader = req.headers.authorization;
  let userQuota = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = (req as any).user;
      if (decoded) {
        userQuota = AiConfigStore.getQuotaInfo(decoded.uid, decoded.role);
      }
    } catch {
      // Bỏ qua nếu token không hợp lệ
    }
  }

  res.json({
    success: true,
    isAiEnabled: config.isAiEnabled,
    isConfigured: config.isConfigured,
    modelName: config.modelName,
    dailyStudentQuota: config.dailyStudentQuota,
    dailyTeacherQuota: config.dailyTeacherQuota,
    userQuota,
  });
});

/**
 * POST /api/ai/scaffolding
 * Yêu cầu Trợ giảng Scaffolding AI hỗ trợ học sinh / giải thích bài
 * Quy trình: Xác thực vai trò -> Kiểm tra duyệt học liệu -> Lọc PII -> Sinh phản hồi -> Trả kết quả
 */
router.post('/scaffolding', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const actor = req.user!;
  const {
    lessonId,
    questionPrompt,
    studentAttempt,
    userQuery,
    requestType = 'HINT_STEP',
  } = req.body as {
    lessonId: string;
    questionPrompt?: string;
    studentAttempt?: string;
    userQuery?: string;
    requestType: AiRequestType;
  };

  if (!lessonId) {
    res.status(400).json({ success: false, error: 'Thiếu mã bài học (lessonId).' });
    return;
  }

  // 1. Kiểm tra tồn tại của bài học trong CurriculumStore
  const lesson = CurriculumStore.getLessonById(lessonId);
  if (!lesson) {
    res.status(404).json({ success: false, error: `Không tìm thấy bài học [${lessonId}].` });
    return;
  }

  // 2. RÀNG BUỘC SƯ PHẠM & BẢO VỆ HỌC SINH (Nguyên tắc 2 & Giai đoạn 5):
  // Học sinh tuyệt đối không được truy cập học liệu CHƯA DUYỆT qua AI!
  if (actor.role === 'STUDENT' && lesson.status !== 'APPROVED') {
    res.status(403).json({
      success: false,
      errorCode: 'UNAPPROVED_CONTENT_BLOCKED',
      error: `Bài học [${lesson.title}] hiện đang ở trạng thái [${lesson.statusLabel}]. Theo quy chuẩn an toàn sư phạm của EDUNOVA, Trợ giảng AI chỉ hỗ trợ học sinh đối với các bài học đã được Thẩm định viên phê duyệt chính thức (APPROVED).`,
    });
    return;
  }

  // 3. Chuẩn bị bối cảnh học liệu đã duyệt (TUYỆT ĐỐI KHÔNG GỬI PII CỦA HỌC SINH)
  const coreRules = lesson.content?.coreKnowledge?.rules || [];
  const topicTitle = lesson.topicTitle || '';

  const context = {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    strandCode: lesson.strandCode,
    topicTitle,
    coreRules,
    questionPrompt: questionPrompt?.trim(),
    studentAttempt: studentAttempt?.trim(),
    userQuery: userQuery?.trim(),
    requestType,
    actorRole: actor.role,
  };

  // 4. Gọi tầng tích hợp Gemini ở backend
  const result = await GeminiService.generateScaffolding(context, actor.uid);

  if (!result.success) {
    const statusCode = result.errorCode === 'RATE_LIMITED' ? 429 : 503;
    res.status(statusCode).json(result);
    return;
  }

  res.json(result);
});

/**
 * POST /api/ai/teacher-draft
 * Chế độ dành cho Giáo viên: Soạn nháp câu hỏi tương tự, phản hồi sư phạm
 * Kết quả LUÔN ở trạng thái "Chờ duyệt" (PENDING_REVIEW), không tự thành đáp án chính thức
 */
router.post(
  '/teacher-draft',
  authenticate,
  requireRole(['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const actor = req.user!;
    const {
      lessonId,
      draftType = 'TEACHER_DRAFT_QUESTION',
      customRequirement,
    } = req.body as {
      lessonId: string;
      draftType: 'TEACHER_DRAFT_QUESTION' | 'TEACHER_DRAFT_EXPLANATION';
      customRequirement?: string;
    };

    if (!lessonId) {
      res.status(400).json({ success: false, error: 'Thiếu mã bài học (lessonId).' });
      return;
    }

    const lesson = CurriculumStore.getLessonById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, error: `Không tìm thấy bài học [${lessonId}].` });
      return;
    }

    const context = {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      strandCode: lesson.strandCode,
      topicTitle: lesson.topicTitle,
      coreRules: lesson.content?.coreKnowledge?.rules || [],
      userQuery: customRequirement || 'Soạn nháp nội dung sư phạm hỗ trợ bài học',
      requestType: draftType,
      actorRole: actor.role,
    };

    const result = await GeminiService.generateScaffolding(context, actor.uid);

    if (!result.success) {
      const statusCode = result.errorCode === 'RATE_LIMITED' ? 429 : 503;
      res.status(statusCode).json(result);
      return;
    }

    // Đảm bảo cờ Trạng thái luôn là Chờ duyệt (PENDING_REVIEW)
    if (result.data) {
      result.data.isDraft = true;
      result.data.reviewStatus = 'PENDING_REVIEW';
    }

    AuditService.record({
      action: 'TEACHER_AI_DRAFT_GENERATED',
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      schoolId: actor.schoolId,
      targetType: 'SYSTEM',
      targetId: lessonId,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: {
        draftType,
        status: 'PENDING_REVIEW',
      },
    });

    res.json(result);
  }
);

/**
 * GET /api/ai/admin/config
 * Dành cho SUPER_ADMIN: Đọc cấu hình và chỉ số sử dụng AI
 */
router.get(
  '/admin/config',
  authenticate,
  requireRole('SUPER_ADMIN'),
  (_req: AuthenticatedRequest, res: Response): void => {
    const config = AiConfigStore.getConfig();
    res.json({
      success: true,
      config,
    });
  }
);

/**
 * PATCH /api/ai/admin/config
 * Dành cho SUPER_ADMIN: Cập nhật công tắc AI, hạn mức lượt hỏi, ngưỡng cảnh báo
 */
router.patch(
  '/admin/config',
  authenticate,
  requireRole('SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { isAiEnabled, dailyStudentQuota, dailyTeacherQuota, warningThresholdPercent } = req.body;

    const updated = AiConfigStore.updateConfig({
      isAiEnabled,
      dailyStudentQuota,
      dailyTeacherQuota,
      warningThresholdPercent,
    });

    AuditService.record({
      action: 'AI_SYSTEM_CONFIG_UPDATED',
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetType: 'SYSTEM',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: {
        isAiEnabled: updated.isAiEnabled,
        dailyStudentQuota: updated.dailyStudentQuota,
        dailyTeacherQuota: updated.dailyTeacherQuota,
        warningThresholdPercent: updated.warningThresholdPercent,
      },
    });

    res.json({
      success: true,
      message: 'Đã cập nhật cấu hình Trợ giảng AI thành công.',
      config: updated,
    });
  }
);

/**
 * GET /api/ai/admin/usage-records
 * Dành cho SUPER_ADMIN: Đọc nhật ký sử dụng AI
 */
router.get(
  '/admin/usage-records',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const role = req.query.role as string | undefined;
    const lessonId = req.query.lessonId as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = AiConfigStore.getUsageRecords({ role, lessonId, status, limit });
    res.json({
      success: true,
      total: result.total,
      records: result.records,
    });
  }
);

/**
 * POST /api/ai/admin/test-connection
 * Dành cho SUPER_ADMIN: Thử nghiệm kết nối thực tế tới Gemini API
 */
router.post(
  '/admin/test-connection',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const check = await GeminiService.testConnection();
    res.json({
      success: check.ok,
      message: check.message,
      latencyMs: check.latencyMs,
    });
  }
);

export default router;
