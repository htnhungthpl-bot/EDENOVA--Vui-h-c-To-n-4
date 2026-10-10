/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserStore } from '../services/user-store.ts';
import { AuditService } from '../services/audit-service.ts';

const LOCK_FILE_PATH = path.resolve(import.meta.dirname, '../.super-admin-initialized');

export interface InitSuperAdminResult {
  success: boolean;
  message: string;
  adminEmail?: string;
  adminUid?: string;
}

export function initializeSuperAdmin(options?: {
  initKey?: string;
  email?: string;
  password?: string;
  name?: string;
}): InitSuperAdminResult {
  // 1. Kiểm tra khóa vô hiệu hóa vĩnh viễn
  if (fs.existsSync(LOCK_FILE_PATH) || UserStore.isInitialSuperAdminCreated()) {
    return {
      success: false,
      message:
        '[BẢO MẬT] Hệ thống đã khởi tạo SUPER_ADMIN trước đó. Script khởi tạo một lần đã tự vô hiệu hóa vĩnh viễn.',
    };
  }

  // 2. Kiểm tra mã kích hoạt an toàn (không chấp nhận chạy khống)
  const expectedKey = process.env.INIT_SUPER_ADMIN_KEY || 'edunova-secure-init-2026';
  const providedKey = options?.initKey || process.env.RUN_INIT_KEY;

  if (!providedKey || providedKey !== expectedKey) {
    return {
      success: false,
      message:
        '[BẢO MẬT] Mã kích hoạt (INIT_SUPER_ADMIN_KEY) không chính xác. Yêu cầu cung cấp khóa bí mật một lần từ biến môi trường.',
    };
  }

  // 3. Kiểm tra thông tin tài khoản (TUYỆT ĐỐI KHÔNG DÙNG MẬT KHẨU MẶC ĐỊNH CÔNG KHAI)
  const email = options?.email || process.env.SUPER_ADMIN_EMAIL;
  const password = options?.password || process.env.SUPER_ADMIN_PASSWORD;
  const name = options?.name || 'Tổng Quản trị viên EDUNOVA';

  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'Email không hợp lệ. Vui lòng cung cấp SUPER_ADMIN_EMAIL.',
    };
  }

  if (!password || password.length < 10) {
    return {
      success: false,
      message:
        'Mật khẩu phải có độ dài tối thiểu 10 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Tuyệt đối không dùng mật khẩu mặc định.',
    };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
    return {
      success: false,
      message:
        'Độ phức tạp mật khẩu không đạt chuẩn: Phải chứa đồng thời chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
    };
  }

  // 4. Tạo tài khoản SUPER_ADMIN đầu tiên
  const uid = 'super_admin_' + crypto.randomBytes(8).toString('hex');
  const user = UserStore.createUser({
    uid,
    email,
    name,
    password,
    role: 'SUPER_ADMIN',
  });

  // 5. Đánh dấu cờ và tạo file khóa vĩnh viễn (Self-disabling)
  UserStore.setInitialSuperAdminCreated(true);
  try {
    fs.writeFileSync(
      LOCK_FILE_PATH,
      JSON.stringify({
        initializedAt: new Date().toISOString(),
        adminUid: user.uid,
        adminEmail: user.email,
        note: 'Tập tin này khóa vĩnh viễn script khởi tạo SUPER_ADMIN ban đầu.',
      })
    );
  } catch (err) {
    console.error('Cảnh báo ghi lock file:', err);
  }

  // 6. Ghi Audit Log hành động quan trọng
  AuditService.record({
    actorId: user.uid,
    actorEmail: user.email,
    actorRole: 'SUPER_ADMIN',
    action: 'INITIAL_SUPER_ADMIN_PROVISIONED',
    targetType: 'SYSTEM',
    targetId: user.uid,
    ip: '127.0.0.1 (System Script)',
    status: 'SUCCESS',
    details: {
      mechanism: 'One-time initial bootstrap script',
      selfDisabled: true,
    },
  });

  return {
    success: true,
    message: 'Khởi tạo tài khoản SUPER_ADMIN đầu tiên thành công. Script đã tự vô hiệu hóa vĩnh viễn.',
    adminEmail: user.email,
    adminUid: user.uid,
  };
}

// Nếu chạy trực tiếp từ dòng lệnh: tsx server/scripts/init-super-admin.ts
if (process.argv[1]?.endsWith('init-super-admin.ts')) {
  console.log('=== QUY TRÌNH KHỞI TẠO AN TOÀN SUPER_ADMIN ĐẦU TIÊN ===');
  const result = initializeSuperAdmin();
  if (result.success) {
    console.log('✅ Thành công:', result.message);
    console.log('   Email:', result.adminEmail);
    console.log('   UID:', result.adminUid);
  } else {
    console.error('❌ Thất bại:', result.message);
    process.exit(1);
  }
}
