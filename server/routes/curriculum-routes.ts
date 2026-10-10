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
import { GradingEngine } from '../db/grading-engine.ts';
import { AuditService } from '../services/audit-service.ts';
import { LessonReviewStatus } from '../../src/types/curriculum.ts';
import { PersonalizationEngine } from '../services/personalization-engine.ts';

const router = Router();

router.use(authenticate);

/**
 * GET /api/curriculum/lessons
 * Danh mục 73 bài học Toán 4 kèm trạng thái kiểm duyệt (Chưa đối chiếu / Chờ duyệt / Đã duyệt)
 */
router.get('/lessons', (req: AuthenticatedRequest, res: Response): void => {
  const status = req.query.status as LessonReviewStatus | undefined;
  const lessons = CurriculumStore.getLessons(status);

  res.json({
    success: true,
    total: lessons.length,
    lessons: lessons.map((l) => ({
      id: l.id,
      positionNumber: l.positionNumber,
      title: l.title,
      strandCode: l.strandCode,
      status: l.status,
      statusLabel: l.statusLabel,
      isDetailed: l.isDetailed,
      notes: l.notes,
    })),
  });
});

/**
 * GET /api/curriculum/lessons/:lessonId
 * Chi tiết bài học theo 9 phần sư phạm chuẩn
 */
router.get('/lessons/:lessonId', (req: AuthenticatedRequest, res: Response): void => {
  const { lessonId } = req.params;
  const lesson = CurriculumStore.getLessonById(lessonId);

  if (!lesson) {
    res.status(404).json({ success: false, error: `Không tìm thấy bài học [${lessonId}].` });
    return;
  }

  res.json({
    success: true,
    lesson,
  });
});

/**
 * GET /api/curriculum/questions
 * Lấy danh sách ngân hàng câu hỏi 8 dạng toán
 * Phân quyền: Giáo viên/Reviewer/Admin được xem AnswerKeys; Học sinh tuyệt đối không.
 */
router.get('/questions', (req: AuthenticatedRequest, res: Response): void => {
  const actor = req.user!;
  const isPrivileged = ['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actor.role);
  const lessonId = req.query.lessonId as string | undefined;

  let questions = Array.from(CurriculumStore.questions.values());
  if (lessonId) {
    questions = questions.filter((q) => q.lessonId === lessonId);
  }

  const result = questions.map((q) => {
    if (isPrivileged) {
      return {
        ...q,
        answerKey: CurriculumStore.answerKeys.get(q.id),
      };
    }
    return {
      id: q.id,
      lessonId: q.lessonId,
      lessonPosition: q.lessonPosition,
      questionType: q.questionType,
      prompt: q.prompt,
      options: q.options,
      matchingLeft: q.matchingLeft,
      matchingRight: q.matchingRight,
      orderingItems: q.orderingItems,
      points: q.points,
      difficulty: q.difficulty,
      knowledgeSource: q.knowledgeSource,
      reviewStatus: q.reviewStatus,
    };
  });

  res.json({
    success: true,
    total: result.length,
    isPrivileged,
    questions: result,
  });
});

/**
 * POST /api/curriculum/review-lesson
 * Thao tác thẩm định bài học dành riêng cho CONTENT_REVIEWER và SUPER_ADMIN
 */
router.post(
  '/review-lesson',
  requireRole('CONTENT_REVIEWER', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { lessonId, action, reason } = req.body;
    const actor = req.user!;

    if (!lessonId || !['APPROVE', 'REJECT'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp lessonId và action (APPROVE | REJECT).',
      });
      return;
    }

    try {
      if (action === 'APPROVE') {
        const approved = CurriculumStore.approveLesson(lessonId, actor.email);

        AuditService.record({
          actorId: actor.uid,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'APPROVE_LESSON',
          targetType: 'CONTENT',
          targetId: lessonId,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          status: 'SUCCESS',
          details: { title: approved.title, newStatus: 'APPROVED' },
        });

        res.json({
          success: true,
          message: `Đã phê duyệt thành công bài học [${approved.title}]. Bài học này đã đủ điều kiện để giáo viên giao bài tập.`,
          lesson: approved,
        });
      } else {
        const rejected = CurriculumStore.rejectLesson(lessonId, actor.email, reason || 'Cần bổ sung');

        AuditService.record({
          actorId: actor.uid,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'REJECT_LESSON',
          targetType: 'CONTENT',
          targetId: lessonId,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          status: 'SUCCESS',
          details: { title: rejected.title, reason },
        });

        res.json({
          success: true,
          message: `Đã từ chối bài học [${rejected.title}] và chuyển về trạng thái DRAFT.`,
          lesson: rejected,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thẩm định';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * POST /api/curriculum/import-catalog
 * Nhập/Cập nhật danh mục phân phối chương trình 73 bài từ tài liệu chính thức
 * Quyền: CONTENT_REVIEWER hoặc SUPER_ADMIN
 */
router.post(
  '/import-catalog',
  requireRole('CONTENT_REVIEWER', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ. Vui lòng cung cấp danh sách mảng các bài học cần cập nhật.',
      });
      return;
    }

    try {
      const result = CurriculumStore.importLessonCatalog(items);

      AuditService.record({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'IMPORT_CURRICULUM_CATALOG',
        targetType: 'CONTENT',
        targetId: 'toan4_73_lessons',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: { updatedCount: result.updatedCount, totalCount: result.totalCount },
      });

      res.json({
        success: true,
        message: `Đã đối chiếu và cập nhật thành công ${result.updatedCount} bài trong tổng số ${result.totalCount} bài học.`,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật danh mục';
      res.status(500).json({ success: false, error: msg });
    }
  }
);

/**
 * POST /api/curriculum/assignments
 * Giáo viên tạo và giao bài tập (Chỉ được giao nội dung ĐÃ DUYỆT)
 */
router.post(
  '/assignments',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { classId, lessonId, title, instructions, deadline } = req.body;

    if (!classId || !lessonId || !title || !deadline) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ: classId, lessonId, title, deadline.',
      });
      return;
    }

    try {
      const assignment = CurriculumStore.createAssignment({
        schoolId: actor.schoolId || 'school_alpha',
        classId,
        teacherId: actor.uid,
        lessonId,
        title,
        instructions: instructions || 'Hoàn thành bài tập đúng hạn.',
        deadline,
      });

      AuditService.record({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'CREATE_HOMEWORK_ASSIGNMENT',
        targetType: 'CLASS',
        targetId: classId,
        schoolId: actor.schoolId,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: { assignmentId: assignment.id, lessonId, title },
      });

      res.status(201).json({
        success: true,
        message: `Đã giao bài tập [${assignment.title}] cho lớp [${classId}].`,
        assignment,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi giao bài tập';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * GET /api/curriculum/assignments/class/:classId
 * Danh sách bài tập được giao cho lớp
 */
router.get('/assignments/class/:classId', (req: AuthenticatedRequest, res: Response): void => {
  const { classId } = req.params;
  const assignments = CurriculumStore.getAssignmentsByClass(classId);

  res.json({
    success: true,
    classId,
    total: assignments.length,
    assignments,
  });
});

/**
 * GET /api/curriculum/assignments/:assignmentId/questions
 * Học sinh lấy đề bài câu hỏi (TUYỆT ĐỐI KHÔNG TRẢ VỀ ANSWER KEYS)
 */
router.get('/assignments/:assignmentId/questions', (req: AuthenticatedRequest, res: Response): void => {
  const { assignmentId } = req.params;
  const assignment = CurriculumStore.getAssignmentById(assignmentId);

  if (!assignment) {
    res.status(404).json({ success: false, error: 'Không tìm thấy bài tập.' });
    return;
  }

  // Lấy câu hỏi: Với học sinh, flag withAnswerKeys = false
  const questionsWithoutKeys = assignment.questionIds.map((qId) => {
    const q = CurriculumStore.questions.get(qId);
    return {
      id: q?.id,
      questionType: q?.questionType,
      prompt: q?.prompt,
      options: q?.options,
      matchingLeft: q?.matchingLeft,
      matchingRight: q?.matchingRight,
      orderingItems: q?.orderingItems,
      points: q?.points,
      difficulty: q?.difficulty,
    };
  });

  res.json({
    success: true,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      deadline: assignment.deadline,
      questionsCount: questionsWithoutKeys.length,
    },
    questions: questionsWithoutKeys,
  });
});

/**
 * POST /api/curriculum/submissions
 * Học sinh nộp bài tập & Backend chấm bằng quy tắc xác định
 */
router.post(
  '/submissions',
  requireRole('STUDENT', 'TEACHER', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { assignmentId, classId, answers } = req.body;

    if (!assignmentId || !classId) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp assignmentId và classId.',
      });
      return;
    }

    try {
      const submission = GradingEngine.gradeSubmission({
        assignmentId,
        classId,
        studentId: actor.uid,
        answers: answers || [],
      });

      AuditService.record({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'SUBMIT_ASSIGNMENT',
        targetType: 'USER',
        targetId: submission.id,
        schoolId: actor.schoolId,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: {
          totalScore: submission.totalScore,
          maxScore: submission.maxScore,
          accuracy: submission.accuracyPercentage,
        },
      });

      // Cập nhật thành tựu gamification (không cấp trùng)
      const gamificationUpdate = PersonalizationEngine.updateGamificationOnSubmission(actor.uid);

      res.status(201).json({
        success: true,
        message: 'Đã nộp bài và hoàn thành chấm điểm tự động bằng quy tắc chuẩn.',
        submission,
        gamification: gamificationUpdate,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi chấm bài';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * GET /api/curriculum/submissions/:submissionId
 * Xem kết quả bài làm và lời giải chi tiết
 */
router.get('/submissions/:submissionId', (req: AuthenticatedRequest, res: Response): void => {
  const { submissionId } = req.params;
  const sub = CurriculumStore.submissions.get(submissionId);

  if (!sub) {
    res.status(404).json({ success: false, error: 'Không tìm thấy kết quả bài nộp.' });
    return;
  }

  res.json({
    success: true,
    submission: sub,
  });
});

export default router;
