/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { DataStore } from '../db/data-store.ts';

const router = Router();

router.use(authenticate);

/**
 * GET /api/questions
 * Lấy danh sách câu hỏi.
 * QUY TẮC BẢO MẬT:
 * - Học sinh (STUDENT): Chỉ nhận đề bài và phương án, TUYỆT ĐỐI KHÔNG nhận AnswerKeys!
 * - Giáo viên (TEACHER), Thẩm định viên (CONTENT_REVIEWER), SUPER_ADMIN: Được nhận đầy đủ AnswerKeys.
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const actor = req.user!;
  const isPrivileged = ['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN'].includes(actor.role);

  const questions = DataStore.getQuestions(isPrivileged);

  res.json({
    success: true,
    count: questions.length,
    userRole: actor.role,
    answerKeysIncluded: isPrivileged,
    questions,
  });
});

export default router;
