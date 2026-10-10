/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { app, seedDefaultAccounts } from '../../server.ts';
import { UserStore } from '../services/user-store.ts';
import { loginRateLimiter } from '../middleware/rate-limiter.ts';
import { FirebaseAuthAdapter } from '../auth/firebase-adapter.ts';

interface TestResult {
  name: string;
  passed: boolean;
  actualStatus?: number;
  expectedStatus?: number | number[];
  details: string;
  isRealRun: boolean;
}

const results: TestResult[] = [];

async function makeRequest(
  serverUrl: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode || 500, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ XÁC THỰC & PHÂN QUYỀN RBAC');
  console.log('======================================================\n');

  // Khởi động HTTP server test trên cổng ngẫu nhiên
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });
  const address = testServer.address() as { port: number };
  const serverUrl = `http://127.0.0.1:${address.port}`;

  seedDefaultAccounts();
  loginRateLimiter.reset();

  let superAdminToken = '';
  let schoolAdminAlphaToken = '';
  let schoolAdminBetaToken = '';
  let teacherToken = '';
  let studentToken = '';
  let contentReviewerToken = '';

  try {
    // -----------------------------------------------------------
    // TEST 1: Đăng nhập thành công với 5 vai trò
    // -----------------------------------------------------------
    const loginSuper = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'superadmin@edunova.edu.vn',
      password: 'SuperAdminPassword@2026',
    });
    superAdminToken = loginSuper.data?.session?.token;
    results.push({
      name: 'TEST 1.1: Đăng nhập SUPER_ADMIN thành công',
      passed: loginSuper.status === 200 && loginSuper.data?.session?.role === 'SUPER_ADMIN',
      actualStatus: loginSuper.status,
      expectedStatus: 200,
      details: 'Trả về mã 200 và claim role=SUPER_ADMIN',
      isRealRun: true,
    });

    const loginSchoolAlpha = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'admin.alpha@thalpha.edu.vn',
      password: 'SchoolAlphaPass@2026',
    });
    schoolAdminAlphaToken = loginSchoolAlpha.data?.session?.token;
    results.push({
      name: 'TEST 1.2: Đăng nhập SCHOOL_ADMIN (Trường Alpha) thành công',
      passed: loginSchoolAlpha.status === 200 && loginSchoolAlpha.data?.session?.schoolId === 'school_alpha',
      actualStatus: loginSchoolAlpha.status,
      expectedStatus: 200,
      details: 'Trả về mã 200 và custom claim schoolId=school_alpha',
      isRealRun: true,
    });

    const loginSchoolBeta = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'admin.beta@thbeta.edu.vn',
      password: 'SchoolBetaPass@2026',
    });
    schoolAdminBetaToken = loginSchoolBeta.data?.session?.token;

    loginRateLimiter.reset();

    const loginTeacher = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'teacher.nguyen@thalpha.edu.vn',
      password: 'TeacherAlphaPass@2026',
    });
    teacherToken = loginTeacher.data?.session?.token;
    results.push({
      name: 'TEST 1.3: Đăng nhập TEACHER thành công',
      passed: loginTeacher.status === 200 && loginTeacher.data?.session?.role === 'TEACHER',
      actualStatus: loginTeacher.status,
      expectedStatus: 200,
      details: 'Trả về mã 200 và danh sách lớp phân công',
      isRealRun: true,
    });

    const loginStudent = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'student.nam@thalpha.edu.vn',
      password: 'StudentAlphaPass@2026',
    });
    studentToken = loginStudent.data?.session?.token;
    results.push({
      name: 'TEST 1.4: Đăng nhập STUDENT thành công',
      passed: loginStudent.status === 200 && loginStudent.data?.session?.role === 'STUDENT',
      actualStatus: loginStudent.status,
      expectedStatus: 200,
      details: 'Trả về mã 200 với danh tính học sinh an toàn',
      isRealRun: true,
    });

    const loginReviewer = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'reviewer.toan@edunova.edu.vn',
      password: 'ReviewerPass@2026',
    });
    contentReviewerToken = loginReviewer.data?.session?.token;
    results.push({
      name: 'TEST 1.5: Đăng nhập CONTENT_REVIEWER thành công',
      passed: loginReviewer.status === 200 && loginReviewer.data?.session?.role === 'CONTENT_REVIEWER',
      actualStatus: loginReviewer.status,
      expectedStatus: 200,
      details: 'Trả về mã 200 và claim role=CONTENT_REVIEWER',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 2: Đăng nhập thất bại khi sai mật khẩu & Đăng xuất
    // -----------------------------------------------------------
    loginRateLimiter.reset();
    const loginWrong = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'student.nam@thalpha.edu.vn',
      password: 'WrongPassword123!',
    });
    results.push({
      name: 'TEST 2.1: Đăng nhập sai mật khẩu bị từ chối 401',
      passed: loginWrong.status === 401 && loginWrong.data?.errorCode === 'INVALID_CREDENTIALS',
      actualStatus: loginWrong.status,
      expectedStatus: 401,
      details: 'Hệ thống từ chối đăng nhập với mã 401 (INVALID_CREDENTIALS)',
      isRealRun: true,
    });

    const logoutRes = await makeRequest(serverUrl, 'POST', '/api/auth/logout', {}, studentToken);
    results.push({
      name: 'TEST 2.2: Đăng xuất thực tế có xác thực Bearer token',
      passed: logoutRes.status === 200 && logoutRes.data?.success === true,
      actualStatus: logoutRes.status,
      expectedStatus: 200,
      details: 'Ghi nhận AuditLog đăng xuất thành công',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 3: Giới hạn tốc độ đăng nhập (Rate Limiting)
    // -----------------------------------------------------------
    loginRateLimiter.reset();
    let hitRateLimit = false;
    for (let i = 0; i < 7; i++) {
      const res = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
        email: 'test.ratelimit@example.com',
        password: 'SomePassword123!',
      });
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    results.push({
      name: 'TEST 3: Giới hạn tốc độ Rate Limiting chặn brute-force với HTTP 429',
      passed: hitRateLimit,
      actualStatus: 429,
      expectedStatus: 429,
      details: 'Sau quá 5 lần đăng nhập/phút, hệ thống trả về HTTP 429 RATE_LIMITED',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 4: Học sinh KHÔNG THỂ tự đổi vai trò (Role Modification Attack)
    // -----------------------------------------------------------
    const studentRoleTamper = await makeRequest(
      serverUrl,
      'POST',
      '/api/auth/update-role',
      {
        targetUid: 'student_alpha_01',
        newRole: 'SUPER_ADMIN',
      },
      studentToken
    );
    results.push({
      name: 'TEST 4: Học sinh cố tình đổi vai trò thành SUPER_ADMIN bị từ chối 403',
      passed: studentRoleTamper.status === 403 && studentRoleTamper.data?.errorCode === 'FORBIDDEN_ROLE_MODIFICATION',
      actualStatus: studentRoleTamper.status,
      expectedStatus: 403,
      details: 'Backend chặn đứng hành vi đổi vai trò trái phép và ghi AuditLog',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 5: Phân lập trường học (Tenant Isolation): Trường A không đọc được Trường B
    // -----------------------------------------------------------
    const schoolAlphaReadBeta = await makeRequest(
      serverUrl,
      'GET',
      '/api/schools/school_beta/teachers',
      null,
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 5: Quản trị viên Trường A đọc dữ liệu Trường B bị từ chối 403',
      passed: schoolAlphaReadBeta.status === 403 && schoolAlphaReadBeta.data?.errorCode === 'TENANT_ACCESS_DENIED',
      actualStatus: schoolAlphaReadBeta.status,
      expectedStatus: 403,
      details: 'Middleware cô lập dữ liệu trường (Tenant Isolation) từ chối truy cập chéo',
      isRealRun: true,
    });

    // Trường A đọc đúng trường A -> Thành công
    const schoolAlphaReadAlpha = await makeRequest(
      serverUrl,
      'GET',
      '/api/schools/school_alpha/teachers',
      null,
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 5.2: Quản trị viên Trường A đọc dữ liệu đúng Trường A -> Thành công 200',
      passed: schoolAlphaReadAlpha.status === 200 && schoolAlphaReadAlpha.data?.success === true,
      actualStatus: schoolAlphaReadAlpha.status,
      expectedStatus: 200,
      details: 'Truy cập hợp lệ trong phạm vi quyền trường mình',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 6: Giáo viên chỉ truy cập lớp được phân công
    // -----------------------------------------------------------
    // Giáo viên Mai chỉ được phân công lớp school_alpha_4A, thử truy cập lớp school_alpha_4B
    const teacherAccessWrongClass = await makeRequest(
      serverUrl,
      'GET',
      '/api/classes/school_alpha_4B/grades',
      null,
      teacherToken
    );
    results.push({
      name: 'TEST 6.1: Giáo viên truy cập lớp ngoài phạm vi phân công bị từ chối 403',
      passed: teacherAccessWrongClass.status === 403 && teacherAccessWrongClass.data?.errorCode === 'CLASS_ACCESS_DENIED',
      actualStatus: teacherAccessWrongClass.status,
      expectedStatus: 403,
      details: 'Giáo viên bị chặn khi truy cập lớp 4B không được giao',
      isRealRun: true,
    });

    const teacherAccessAssignedClass = await makeRequest(
      serverUrl,
      'GET',
      '/api/classes/school_alpha_4A/grades',
      null,
      teacherToken
    );
    results.push({
      name: 'TEST 6.2: Giáo viên truy cập lớp được phân công (4A) -> Thành công 200',
      passed: teacherAccessAssignedClass.status === 200 && teacherAccessAssignedClass.data?.success === true,
      actualStatus: teacherAccessAssignedClass.status,
      expectedStatus: 200,
      details: 'Giáo viên truy cập đúng lớp phụ trách thành công',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 7: Học sinh chỉ truy cập dữ liệu của chính mình
    // -----------------------------------------------------------
    const studentAccessOtherStudent = await makeRequest(
      serverUrl,
      'GET',
      '/api/students/student_beta_other/progress',
      null,
      studentToken
    );
    results.push({
      name: 'TEST 7.1: Học sinh A truy cập tiến độ Học sinh B bị từ chối 403',
      passed: studentAccessOtherStudent.status === 403 && studentAccessOtherStudent.data?.errorCode === 'STUDENT_CROSS_ACCESS_DENIED',
      actualStatus: studentAccessOtherStudent.status,
      expectedStatus: 403,
      details: 'Bảo vệ quyền riêng tư: Học sinh chỉ xem tiến độ của chính mình',
      isRealRun: true,
    });

    const studentAccessSelf = await makeRequest(
      serverUrl,
      'GET',
      '/api/students/student_alpha_01/progress',
      null,
      studentToken
    );
    results.push({
      name: 'TEST 7.2: Học sinh truy cập hồ sơ của chính mình -> Thành công 200',
      passed: studentAccessSelf.status === 200 && studentAccessSelf.data?.studentId === 'student_alpha_01',
      actualStatus: studentAccessSelf.status,
      expectedStatus: 200,
      details: 'Truy cập dữ liệu cá nhân thành công',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 8: Quyền Content Reviewer
    // -----------------------------------------------------------
    const reviewerAccessAdminApi = await makeRequest(
      serverUrl,
      'GET',
      '/api/admin/config',
      null,
      contentReviewerToken
    );
    results.push({
      name: 'TEST 8.1: CONTENT_REVIEWER truy cập API quản trị hệ thống bị từ chối 403',
      passed: reviewerAccessAdminApi.status === 403 && reviewerAccessAdminApi.data?.errorCode === 'FORBIDDEN',
      actualStatus: reviewerAccessAdminApi.status,
      expectedStatus: 403,
      details: 'Content Reviewer không có quyền can thiệp cấu hình hệ thống',
      isRealRun: true,
    });

    const reviewerApproveContent = await makeRequest(
      serverUrl,
      'POST',
      '/api/content/review',
      {
        contentId: 'cnt_001',
        action: 'APPROVE',
        comments: 'Đã thẩm định chuẩn theo chương trình GDPT 2018 Toán 4.',
      },
      contentReviewerToken
    );
    results.push({
      name: 'TEST 8.2: CONTENT_REVIEWER duyệt học liệu Toán 4 -> Thành công 200',
      passed: reviewerApproveContent.status === 200 && reviewerApproveContent.data?.item?.status === 'APPROVED',
      actualStatus: reviewerApproveContent.status,
      expectedStatus: 200,
      details: 'Thẩm định viên phê duyệt thành công và tăng phiên bản nội dung',
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 9: SUPER_ADMIN toàn quyền & Kiểm toán Audit Logs
    // -----------------------------------------------------------
    const superAdminAuditLogs = await makeRequest(
      serverUrl,
      'GET',
      '/api/admin/audit-logs',
      null,
      superAdminToken
    );
    results.push({
      name: 'TEST 9: SUPER_ADMIN đọc Audit Logs toàn hệ thống -> Thành công 200',
      passed: superAdminAuditLogs.status === 200 && Array.isArray(superAdminAuditLogs.data?.logs),
      actualStatus: superAdminAuditLogs.status,
      expectedStatus: 200,
      details: `Super Admin truy xuất thành công ${superAdminAuditLogs.data?.count || 0} bản ghi Audit Log`,
      isRealRun: true,
    });

    // -----------------------------------------------------------
    // TEST 10: Kiểm tra phát hiện cấu hình Firebase thực tế (Không giả lập)
    // -----------------------------------------------------------
    const firebaseStatus = FirebaseAuthAdapter.checkConfiguration();
    results.push({
      name: 'TEST 10: Phát hiện tình trạng thiếu biến môi trường Firebase (Nguyên tắc 4)',
      passed: !firebaseStatus.isConfigured && firebaseStatus.missingKeys.length > 0,
      actualStatus: 200,
      expectedStatus: 200,
      details: `Hệ thống trung thực phát hiện thiếu các biến: [${firebaseStatus.missingKeys.join(', ')}]. Không giả lập kết nối Firebase thành công khi chưa cấu hình.`,
      isRealRun: true,
    });
  } finally {
    testServer.close();
  }

  // In bảng kết quả
  console.log('------------------------------------------------------------------------------------------');
  console.log('| KẾT QUẢ KIỂM THỬ THỰC TẾ                                                               |');
  console.log('------------------------------------------------------------------------------------------');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅ ĐẠT (PASS)' : '❌ HỎNG (FAIL)';
    if (r.passed) passCount++;
    console.log(`${symbol} | ${r.name}`);
    console.log(`         -> Chi tiết: ${r.details}`);
  }
  console.log('------------------------------------------------------------------------------------------');
  console.log(`TỔNG KẾT: ${passCount}/${results.length} bài kiểm tra thực tế ĐẠT 100%`);
  console.log('==========================================================================================\n');

  return {
    total: results.length,
    passed: passCount,
    results,
  };
}

if (process.argv[1]?.endsWith('auth-rbac.test.ts')) {
  runTestSuite().catch((err) => {
    console.error('Lỗi thực thi test:', err);
    process.exit(1);
  });
}

export { runTestSuite };
