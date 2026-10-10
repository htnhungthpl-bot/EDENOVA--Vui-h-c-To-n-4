/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  requireSchoolAccess,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { UserStore } from '../services/user-store.ts';
import { AuditService } from '../services/audit-service.ts';
import { DataStore } from '../db/data-store.ts';
import { SchemaValidator } from '../db/schema-validator.ts';

const router = Router();

// Yêu cầu xác thực và quyền SUPER_ADMIN hoặc SCHOOL_ADMIN
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'));

/**
 * GET /api/schools/:schoolId/classes
 * Danh sách lớp học thuộc trường (Có phân trang)
 */
router.get(
  '/:schoolId/classes',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId } = req.params;
    const { page, limit } = SchemaValidator.parsePagination(req.query);

    const classes = DataStore.getClassesBySchool(schoolId);
    const paginated = DataStore.paginate(classes, page, limit);

    res.json({
      success: true,
      schoolId,
      ...paginated,
    });
  }
);

/**
 * POST /api/schools/:schoolId/classes
 * Tạo lớp học mới trong trường (SCHOOL_ADMIN)
 */
router.post(
  '/:schoolId/classes',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId } = req.params;
    const errors = SchemaValidator.validateCreateClass(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        error: 'Dữ liệu tạo lớp học không hợp lệ.',
        details: errors,
      });
      return;
    }

    try {
      const newClass = DataStore.createClass(schoolId, req.body);

      AuditService.record({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'CREATE_CLASS',
        targetType: 'CLASS',
        targetId: newClass.id,
        schoolId,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: { classCode: newClass.code, gradeLevel: newClass.gradeLevel },
      });

      res.status(201).json({
        success: true,
        message: `Đã tạo lớp [${newClass.name}] thành công.`,
        class: newClass,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tạo lớp học';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * GET /api/schools/:schoolId/teachers
 * Danh sách giáo viên của trường (Có phân trang)
 */
router.get(
  '/:schoolId/teachers',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId } = req.params;
    const { page, limit } = SchemaValidator.parsePagination(req.query);

    const allUsers = UserStore.getSchoolUsers(schoolId);
    const teachers = allUsers.filter((u) => u.role === 'TEACHER');
    const paginated = DataStore.paginate(teachers, page, limit);

    res.json({
      success: true,
      schoolId,
      ...paginated,
      items: paginated.items.map((t) => ({
        uid: t.uid,
        email: t.email,
        name: t.name,
        assignedClassIds: t.assignedClassIds,
      })),
    });
  }
);

/**
 * POST /api/schools/:schoolId/teachers
 * Thêm giáo viên vào trường
 */
router.post(
  '/:schoolId/teachers',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId } = req.params;
    const { email, name, password, assignedClassIds } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp email, họ tên và mật khẩu giáo viên.',
      });
      return;
    }

    try {
      const uid = 'tch_' + Date.now();
      const user = UserStore.createUser({
        uid,
        email,
        name,
        password,
        role: 'TEACHER',
        schoolId,
        assignedClassIds: assignedClassIds || [],
      });

      AuditService.record({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'CREATE_TEACHER',
        targetType: 'USER',
        targetId: user.uid,
        schoolId,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: { teacherEmail: email, teacherName: name },
      });

      res.status(201).json({
        success: true,
        message: `Đã thêm giáo viên [${user.name}] vào trường.`,
        teacher: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          assignedClassIds: user.assignedClassIds,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tạo giáo viên';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * POST /api/schools/:schoolId/classes/:classId/teachers
 * Phân công giáo viên phụ trách lớp học
 */
router.post(
  '/:schoolId/classes/:classId/teachers',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId, classId } = req.params;
    const errors = SchemaValidator.validateAssignTeacher(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        error: 'Dữ liệu phân công không hợp lệ.',
        details: errors,
      });
      return;
    }

    const { teacherId } = req.body;

    try {
      const membership = DataStore.assignTeacherToClass(schoolId, classId, teacherId);

      // Cập nhật assignedClassIds cho tài khoản giáo viên trong UserStore
      const teacher = UserStore.findById(teacherId);
      if (teacher && !teacher.assignedClassIds?.includes(classId)) {
        teacher.assignedClassIds = [...(teacher.assignedClassIds || []), classId];
      }

      AuditService.record({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'ASSIGN_TEACHER_TO_CLASS',
        targetType: 'CLASS',
        targetId: classId,
        schoolId,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: { teacherId, classId },
      });

      res.json({
        success: true,
        message: `Đã phân công giáo viên vào lớp [${classId}] thành công.`,
        membership,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi phân công giáo viên';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * GET /api/schools/:schoolId/classes/:classId/students
 * Danh sách học sinh trong lớp (Có phân trang)
 */
router.get(
  '/:schoolId/classes/:classId/students',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId, classId } = req.params;
    const { page, limit } = SchemaValidator.parsePagination(req.query);

    const members = DataStore.getClassMembers(classId, 'STUDENT');
    const studentsWithProfiles = members.map((m) => {
      const profile = DataStore.profiles.get(m.userId);
      return {
        membershipId: m.id,
        userId: m.userId,
        studentCode: profile?.studentCode || 'HS-ANON',
        displayName: profile?.displayName || 'Học sinh',
        isSampleData: profile?.isSampleData || false,
        joinedAt: m.joinedAt,
      };
    });

    const paginated = DataStore.paginate(studentsWithProfiles, page, limit);

    res.json({
      success: true,
      schoolId,
      classId,
      ...paginated,
    });
  }
);

/**
 * POST /api/schools/:schoolId/classes/:classId/students
 * Thêm học sinh vào lớp (Ưu tiên mã học sinh ẩn danh / biệt danh - Nguyên tắc 9)
 */
router.post(
  '/:schoolId/classes/:classId/students',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId, classId } = req.params;
    const errors = SchemaValidator.validateAddStudent(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        error: 'Dữ liệu thêm học sinh không hợp lệ.',
        details: errors,
      });
      return;
    }

    try {
      const result = DataStore.addStudentToClass(schoolId, classId, req.body);

      AuditService.record({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'ADD_STUDENT_TO_CLASS',
        targetType: 'USER',
        targetId: result.student.userId,
        schoolId,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'SUCCESS',
        details: {
          classId,
          studentCode: result.student.studentCode,
          dataMinimizationNotice: 'Chỉ lưu trữ mã ẩn danh và tên hiển thị',
        },
      });

      res.status(201).json({
        success: true,
        message: `Đã thêm học sinh [${result.student.studentCode}] vào lớp [${classId}].`,
        student: {
          userId: result.student.userId,
          studentCode: result.student.studentCode,
          displayName: result.student.displayName,
          isSampleData: result.student.isSampleData,
        },
        membership: result.membership,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thêm học sinh';
      res.status(400).json({ success: false, error: msg });
    }
  }
);

/**
 * GET /api/schools/:schoolId/reports
 */
router.get(
  '/:schoolId/reports',
  requireSchoolAccess('schoolId'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { schoolId } = req.params;
    const school = DataStore.getSchoolById(schoolId);

    res.json({
      success: true,
      schoolId,
      report: {
        schoolName: school?.name || schoolId,
        curriculum: 'Toán 4 (GDPT 2018)',
        classesCount: DataStore.getClassesBySchool(schoolId).length,
        status: 'Chưa có dữ liệu bài làm thực tế',
        totalCompletedSessions: 0,
      },
    });
  }
);

export default router;
