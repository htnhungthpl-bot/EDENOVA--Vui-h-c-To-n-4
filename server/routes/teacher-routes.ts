/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  requireTeacherClassAccess,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { AuditService } from '../services/audit-service.ts';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

/**
 * GET /api/classes/:classId/grades
 * Lấy điểm và tiến độ học tập của một lớp (Giáo viên chỉ được xem lớp được phân công)
 */
router.get(
  '/:classId/grades',
  requireTeacherClassAccess('classId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { classId } = req.params;

    res.json({
      success: true,
      classId,
      status: 'Chưa có dữ liệu bài làm',
      records: [],
      message: `Bảng điểm lớp [${classId}] chưa có bản ghi làm bài thực tế.`,
    });
  }
);

/**
 * POST /api/classes/:classId/assignments
 * Giao bài tập cho lớp
 */
router.post(
  '/:classId/assignments',
  requireTeacherClassAccess('classId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { classId } = req.params;
    const { topicCode, title } = req.body;

    if (!topicCode || !title) {
      res.status(400).json({ success: false, error: 'Thiếu mã chủ đề hoặc tiêu đề bài tập.' });
      return;
    }

    AuditService.record({
      actorId: req.user!.uid,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'ASSIGN_HOMEWORK',
      targetType: 'CLASS',
      targetId: classId,
      schoolId: req.user!.schoolId,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      status: 'SUCCESS',
      details: { topicCode, title },
    });

    res.json({
      success: true,
      message: `Đã giao bài tập [${title}] cho lớp [${classId}].`,
      assignment: {
        id: 'assign_' + Date.now(),
        classId,
        topicCode,
        title,
        createdAt: new Date().toISOString(),
      },
    });
  }
);

export default router;
