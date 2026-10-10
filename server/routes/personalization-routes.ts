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
import { PersonalizationEngine } from '../services/personalization-engine.ts';

const router = Router();

/**
 * GET /api/personalization/public-leaderboard
 * Tuyệt đối KHÔNG có bảng xếp hạng công khai thông tin cá nhân học sinh (Trả về 404 để bảo vệ tâm lý)
 */
router.get('/public-leaderboard', (_req, res): void => {
  res.status(404).json({
    success: false,
    error: 'Không hỗ trợ bảng xếp hạng công khai thông tin cá nhân. EDUNOVA cam kết không tạo áp lực tiêu cực lên học sinh.',
  });
});

router.use(authenticate);

/**
 * GET /api/personalization/analytics
 * Lấy dữ liệu phân tích học tập thực tế (tỷ lệ đúng, dạng lỗi, tiến trình theo thời gian)
 */
router.get('/analytics', (req: AuthenticatedRequest, res: Response): void => {
  const actor = req.user!;
  // Học sinh chỉ xem của mình; Giáo viên/Quản trị viên có thể xem của học sinh trong lớp
  let targetStudentId = actor.uid;
  if (['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actor.role)) {
    if (req.query.studentId && typeof req.query.studentId === 'string') {
      targetStudentId = req.query.studentId;
    }
  }

  const analytics = PersonalizationEngine.analyzeStudentLearning(targetStudentId);
  res.json({
    success: true,
    analytics,
  });
});

/**
 * GET /api/personalization/recommendations
 * Lấy đề xuất cá nhân hóa minh bạch bằng quy tắc (có kiểm tra ngưỡng dữ liệu)
 */
router.get('/recommendations', (req: AuthenticatedRequest, res: Response): void => {
  const actor = req.user!;
  let targetStudentId = actor.uid;
  if (['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actor.role)) {
    if (req.query.studentId && typeof req.query.studentId === 'string') {
      targetStudentId = req.query.studentId;
    }
  }

  const recommendations = PersonalizationEngine.generateRecommendations(targetStudentId);
  res.json({
    success: true,
    recommendations,
  });
});

/**
 * GET /api/personalization/gamification
 * Lấy hồ sơ sao, huy hiệu, nhiệm vụ học tập và chặng mở khóa (Không bảng xếp hạng công khai)
 */
router.get('/gamification', (req: AuthenticatedRequest, res: Response): void => {
  const actor = req.user!;
  let targetStudentId = actor.uid;
  if (['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actor.role)) {
    if (req.query.studentId && typeof req.query.studentId === 'string') {
      targetStudentId = req.query.studentId;
    }
  }

  const profile = PersonalizationEngine.getOrCreateGamificationProfile(targetStudentId);
  const badges = PersonalizationEngine.getBadgesWithStatus(targetStudentId);
  const stages = PersonalizationEngine.getStagesWithStatus(targetStudentId);
  const missions = PersonalizationEngine.getDailyMissions(targetStudentId);

  res.json({
    success: true,
    profile,
    badges,
    stages,
    missions,
  });
});

export default router;
