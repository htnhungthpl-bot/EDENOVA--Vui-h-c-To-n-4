/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../auth/token-service.ts';
import { AuthClaims, AppRole } from '../../src/types/auth.ts';
import { AuditService } from '../services/audit-service.ts';

// Mở rộng kiểu dữ liệu Request của Express để chứa thông tin người dùng xác thực
export interface AuthenticatedRequest extends Request {
  user?: AuthClaims;
}

/**
 * Middleware trích xuất và xác thực Token từ Header
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      error: 'Yêu cầu mã truy cập hợp lệ (Bearer token). Vui lòng đăng nhập.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const claims = TokenService.verifyToken(token);

  if (!claims) {
    res.status(401).json({
      success: false,
      errorCode: 'INVALID_TOKEN',
      error: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    });
    return;
  }

  req.user = claims;
  next();
}

/**
 * Middleware kiểm tra vai trò được phép (RBAC Role Gate)
 */
export function requireRole(...allowedRolesInput: (AppRole | AppRole[])[]) {
  const allowedRoles = allowedRolesInput.flat();
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        error: 'Chưa xác thực danh tính.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Ghi AuditLog cảnh báo truy cập trái phép
      AuditService.record({
        actorId: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED_ROLE_MISMATCH',
        targetType: 'SECURITY',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        status: 'DENIED',
        details: {
          path: req.originalUrl,
          requiredRoles: allowedRoles,
          actualRole: req.user.role,
        },
      });

      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        error: `Vai trò [${req.user.role}] không có quyền thực hiện thao tác này. Yêu cầu một trong các vai trò: ${allowedRoles.join(
          ', '
        )}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware cô lập dữ liệu theo trường học (Tenant Isolation)
 * Đảm bảo SCHOOL_ADMIN trường A không thể xem hoặc sửa dữ liệu trường B.
 */
export function requireSchoolAccess(schoolIdParam: string = 'schoolId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa xác thực danh tính.' });
      return;
    }

    // SUPER_ADMIN có quyền toàn nền tảng
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    const targetSchoolId = req.params[schoolIdParam] || req.body[schoolIdParam] || (req.query[schoolIdParam] as string);

    if (req.user.role === 'SCHOOL_ADMIN') {
      if (!req.user.schoolId || req.user.schoolId !== targetSchoolId) {
        AuditService.record({
          actorId: req.user.uid,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          action: 'TENANT_ISOLATION_VIOLATION_ATTEMPT',
          targetType: 'SCHOOL',
          targetId: targetSchoolId,
          schoolId: req.user.schoolId,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          status: 'DENIED',
          details: {
            actorSchoolId: req.user.schoolId,
            attemptedSchoolId: targetSchoolId,
          },
        });

        res.status(403).json({
          success: false,
          errorCode: 'TENANT_ACCESS_DENIED',
          error: `Bị từ chối truy cập: Quản trị viên chỉ có quyền trong phạm vi trường [${req.user.schoolId}], không thể truy cập trường [${targetSchoolId}].`,
        });
        return;
      }
      next();
      return;
    }

    // Các vai trò khác không có quyền quản trị trường
    res.status(403).json({
      success: false,
      errorCode: 'FORBIDDEN',
      error: 'Chỉ Quản trị viên trường hoặc Quản trị cấp cao mới có quyền truy cập tài nguyên trường.',
    });
  };
}

/**
 * Middleware kiểm tra quyền truy cập lớp học của Giáo viên
 * Đảm bảo Giáo viên chỉ có quyền trên các lớp được phân công.
 */
export function requireTeacherClassAccess(classIdParam: string = 'classId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa xác thực danh tính.' });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    const targetClassId = req.params[classIdParam] || req.body[classIdParam];

    if (req.user.role === 'TEACHER') {
      const assigned = req.user.assignedClassIds || [];
      if (!assigned.includes(targetClassId)) {
        AuditService.record({
          actorId: req.user.uid,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          action: 'TEACHER_UNAUTHORIZED_CLASS_ACCESS',
          targetType: 'CLASS',
          targetId: targetClassId,
          schoolId: req.user.schoolId,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          status: 'DENIED',
          details: { assignedClasses: assigned, requestedClass: targetClassId },
        });

        res.status(403).json({
          success: false,
          errorCode: 'CLASS_ACCESS_DENIED',
          error: `Giáo viên không được phân công phụ trách lớp học [${targetClassId}].`,
        });
        return;
      }
      next();
      return;
    }

    // SCHOOL_ADMIN có quyền xem lớp trong trường mình
    if (req.user.role === 'SCHOOL_ADMIN') {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      errorCode: 'FORBIDDEN',
      error: 'Không có quyền truy cập lớp học này.',
    });
  };
}

/**
 * Middleware kiểm tra quyền truy cập dữ liệu Học sinh
 * Đảm bảo Học sinh chỉ đọc/sửa dữ liệu của chính mình.
 */
export function requireStudentSelfOrStaff(studentIdParam: string = 'studentId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa xác thực danh tính.' });
      return;
    }

    const targetStudentId = req.params[studentIdParam] || req.body[studentIdParam];

    if (req.user.role === 'STUDENT') {
      if (req.user.uid !== targetStudentId) {
        AuditService.record({
          actorId: req.user.uid,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          action: 'STUDENT_UNAUTHORIZED_CROSS_ACCESS',
          targetType: 'USER',
          targetId: targetStudentId,
          schoolId: req.user.schoolId,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          status: 'DENIED',
          details: { attempt: 'Access another student data' },
        });

        res.status(403).json({
          success: false,
          errorCode: 'STUDENT_CROSS_ACCESS_DENIED',
          error: 'Học sinh chỉ được phép truy cập hồ sơ và kết quả bài tập của chính mình.',
        });
        return;
      }
      next();
      return;
    }

    // SUPER_ADMIN, SCHOOL_ADMIN, TEACHER được phép xem dữ liệu học sinh thuộc thẩm quyền
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      errorCode: 'FORBIDDEN',
      error: 'Không có quyền truy cập dữ liệu học sinh.',
    });
  };
}
