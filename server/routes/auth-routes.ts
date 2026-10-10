/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { UserStore } from '../services/user-store.ts';
import { PasswordHasher } from '../auth/password-hasher.ts';
import { TokenService } from '../auth/token-service.ts';
import { FirebaseAuthAdapter } from '../auth/firebase-adapter.ts';
import { AuditService } from '../services/audit-service.ts';
import { loginRateLimiter } from '../middleware/rate-limiter.ts';
import {
  authenticate,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { AppRole } from '../../src/types/auth.ts';

const router = Router();

/**
 * POST /api/auth/login
 * Đăng nhập với Rate Limiting (tối đa 5 lần/phút) và kiểm tra mật khẩu bảo mật
 */
router.post(
  '/login',
  loginRateLimiter.getMiddleware(),
  (req: Request, res: Response): void => {
    const { email, password } = req.body;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    if (!email || !password) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        error: 'Vui lòng cung cấp đầy đủ email và mật khẩu.',
      });
      return;
    }

    const user = UserStore.findByEmail(email);
    if (!user || !PasswordHasher.verifyPassword(password, user.passwordHash)) {
      AuditService.record({
        actorId: user ? user.uid : 'anonymous',
        actorEmail: email,
        actorRole: user ? user.role : 'STUDENT',
        action: 'LOGIN_FAILED_INVALID_CREDENTIALS',
        targetType: 'SECURITY',
        ip,
        status: 'DENIED',
        details: { attemptedEmail: email },
      });

      res.status(401).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        error: 'Email hoặc mật khẩu không chính xác.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        errorCode: 'USER_DISABLED',
        error: 'Tài khoản này đã bị khóa hoặc tạm dừng hoạt động.',
      });
      return;
    }

    // Tạo token kèm custom claims (role, schoolId, assignedClassIds)
    const session = TokenService.generateSession({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      assignedClassIds: user.assignedClassIds,
    });

    AuditService.record({
      actorId: user.uid,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      targetType: 'USER',
      targetId: user.uid,
      schoolId: user.schoolId,
      ip,
      status: 'SUCCESS',
      details: { role: user.role, schoolId: user.schoolId },
    });

    res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      session,
    });
  }
);

/**
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    AuditService.record({
      actorId: user.uid,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGOUT_SUCCESS',
      targetType: 'USER',
      targetId: user.uid,
      schoolId: user.schoolId,
      ip,
      status: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Đăng xuất thành công.',
    });
  }
);

/**
 * GET /api/auth/me
 */
router.get(
  '/me',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

/**
 * POST /api/auth/update-role
 * Quy định an toàn:
 * - HỌC SINH (STUDENT) TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ ĐỔI VAI TRÒ
 * - Chỉ SUPER_ADMIN mới đổi được mọi vai trò
 * - SCHOOL_ADMIN chỉ đổi được vai trò người dùng trong trường của mình (trừ SUPER_ADMIN)
 */
router.post(
  '/update-role',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const actor = req.user!;
    const { targetUid, newRole, newSchoolId } = req.body;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    if (!targetUid || !newRole) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp targetUid và newRole.',
      });
      return;
    }

    const validRoles: AppRole[] = [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'TEACHER',
      'STUDENT',
      'CONTENT_REVIEWER',
    ];

    if (!validRoles.includes(newRole)) {
      res.status(400).json({
        success: false,
        error: `Vai trò [${newRole}] không hợp lệ.`,
      });
      return;
    }

    // Kiểm tra quyền hạn thay đổi vai trò
    if (actor.role === 'STUDENT' || actor.role === 'TEACHER' || actor.role === 'CONTENT_REVIEWER') {
      AuditService.record({
        actorId: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'UNAUTHORIZED_ROLE_CHANGE_ATTEMPT',
        targetType: 'SECURITY',
        targetId: targetUid,
        ip,
        status: 'DENIED',
        details: { attemptedNewRole: newRole },
      });

      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN_ROLE_MODIFICATION',
        error: `Học sinh hoặc người dùng vai trò [${actor.role}] tuyệt đối không thể tự đổi hoặc gán vai trò. Hành động đã bị chặn và ghi nhận kiểm toán.`,
      });
      return;
    }

    const targetUser = UserStore.findById(targetUid);
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Không tìm thấy người dùng mục tiêu.' });
      return;
    }

    if (actor.role === 'SCHOOL_ADMIN') {
      // SCHOOL_ADMIN chỉ được sửa user trong trường mình và không được cấp SUPER_ADMIN
      if (targetUser.schoolId !== actor.schoolId) {
        res.status(403).json({
          success: false,
          errorCode: 'TENANT_VIOLATION',
          error: 'Quản trị viên trường không thể đổi vai trò người dùng thuộc trường khác.',
        });
        return;
      }
      if (newRole === 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          errorCode: 'FORBIDDEN',
          error: 'Chỉ SUPER_ADMIN mới có quyền chỉ định thêm SUPER_ADMIN.',
        });
        return;
      }
    }

    const updated = UserStore.updateUserRole(targetUid, newRole, newSchoolId);

    AuditService.record({
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_ROLE_UPDATED',
      targetType: 'USER',
      targetId: targetUid,
      schoolId: updated.schoolId,
      ip,
      status: 'SUCCESS',
      details: { previousRole: targetUser.role, newRole: updated.role },
    });

    res.json({
      success: true,
      message: `Đã cập nhật vai trò người dùng [${targetUser.email}] thành [${newRole}].`,
      user: {
        uid: updated.uid,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        schoolId: updated.schoolId,
      },
    });
  }
);

/**
 * GET /api/auth/firebase-status
 * Kiểm tra trạng thái cấu hình thực tế của Firebase Authentication
 */
router.get('/firebase-status', (_req: Request, res: Response): void => {
  const status = FirebaseAuthAdapter.checkConfiguration();
  res.json({
    success: true,
    status,
  });
});

export default router;
