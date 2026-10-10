/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth-routes.ts';
import adminRoutes from './server/routes/admin-routes.ts';
import schoolRoutes from './server/routes/school-routes.ts';
import teacherRoutes from './server/routes/teacher-routes.ts';
import studentRoutes from './server/routes/student-routes.ts';
import contentRoutes from './server/routes/content-routes.ts';
import questionRoutes from './server/routes/question-routes.ts';
import curriculumRoutes from './server/routes/curriculum-routes.ts';
import aiRoutes from './server/routes/ai-routes.ts';
import personalizationRoutes from './server/routes/personalization-routes.ts';
import reportingRoutes from './server/routes/reporting-routes.ts';
import { UserStore } from './server/services/user-store.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Gắn các API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/classes', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/personalization', personalizationRoutes);
app.use('/api/reports', reportingRoutes);

// Khởi tạo các tài khoản xác thực mẫu cho từng vai trò trong môi trường phát triển
export function seedDefaultAccounts() {
  if (UserStore.getAllUsers().length > 0) return;

  // 1. SUPER_ADMIN (Tổng Quản trị)
  UserStore.createUser({
    uid: 'super_admin_001',
    email: 'superadmin@edunova.edu.vn',
    name: 'Tổng Quản trị viên EDUNOVA',
    password: 'SuperAdminPassword@2026',
    role: 'SUPER_ADMIN',
  });
  UserStore.setInitialSuperAdminCreated(true);

  // 2. SCHOOL_ADMIN Trường Alpha
  UserStore.createUser({
    uid: 'school_admin_alpha',
    email: 'admin.alpha@thalpha.edu.vn',
    name: 'Quản trị viên TH Alpha',
    password: 'SchoolAlphaPass@2026',
    role: 'SCHOOL_ADMIN',
    schoolId: 'school_alpha',
  });

  // 3. SCHOOL_ADMIN Trường Beta
  UserStore.createUser({
    uid: 'school_admin_beta',
    email: 'admin.beta@thbeta.edu.vn',
    name: 'Quản trị viên TH Beta',
    password: 'SchoolBetaPass@2026',
    role: 'SCHOOL_ADMIN',
    schoolId: 'school_beta',
  });

  // 4. TEACHER Lớp 4A - Trường Alpha
  UserStore.createUser({
    uid: 'teacher_alpha_01',
    email: 'teacher.nguyen@thalpha.edu.vn',
    name: 'Cô Nguyễn Thị Mai (Giáo viên 4A)',
    password: 'TeacherAlphaPass@2026',
    role: 'TEACHER',
    schoolId: 'school_alpha',
    assignedClassIds: ['school_alpha_4A'],
  });

  // 5. STUDENT Lớp 4A - Trường Alpha
  UserStore.createUser({
    uid: 'student_alpha_01',
    email: 'student.nam@thalpha.edu.vn',
    name: 'Học sinh Trần Văn Nam',
    password: 'StudentAlphaPass@2026',
    role: 'STUDENT',
    schoolId: 'school_alpha',
    assignedClassIds: ['school_alpha_4A'],
  });

  // 6. CONTENT_REVIEWER
  UserStore.createUser({
    uid: 'content_reviewer_01',
    email: 'reviewer.toan@edunova.edu.vn',
    name: 'Chuyên gia Thẩm định Toán 4',
    password: 'ReviewerPass@2026',
    role: 'CONTENT_REVIEWER',
  });

  console.log('[EDUNOVA Server] Đã nạp tài khoản mẫu cho 5 vai trò vào UserStore.');
}

seedDefaultAccounts();

// Tích hợp Vite middleware trong môi trường phát triển
async function setupVite() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(import.meta.dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(import.meta.dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EDUNOVA Server] Máy chủ đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

// Khởi chạy khi thực thi trực tiếp
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  setupVite().catch((err) => {
    console.error('[EDUNOVA Server Error]:', err);
  });
}

export { app };
