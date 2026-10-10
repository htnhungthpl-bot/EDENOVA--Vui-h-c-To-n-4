/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  requireStudentSelfOrStaff,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'));

/**
 * GET /api/students/:studentId/progress
 * Hồ sơ học tập và tiến độ bài làm (Học sinh chỉ xem được của chính mình)
 */
router.get(
  '/:studentId/progress',
  requireStudentSelfOrStaff('studentId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { studentId } = req.params;

    res.json({
      success: true,
      studentId,
      status: 'Chưa có dữ liệu bài làm',
      completedLessons: 0,
      totalExercisesAttempted: 0,
      curriculum: 'Toán 4 (GDPT 2018)',
      message: 'Học sinh chưa hoàn thành bài luyện tập nào.',
    });
  }
);

/**
 * GET /api/students/:studentId/assigned-tasks
 * Danh sách bài tập được giao cho học sinh
 */
router.get(
  '/:studentId/assigned-tasks',
  requireStudentSelfOrStaff('studentId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { studentId } = req.params;

    res.json({
      success: true,
      studentId,
      tasks: [],
      message: 'Chưa có bài tập mới được giao.',
    });
  }
);

export default router;
