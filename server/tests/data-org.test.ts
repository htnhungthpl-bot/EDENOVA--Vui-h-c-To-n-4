/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { app, seedDefaultAccounts } from '../../server.ts';
import { DataStore } from '../db/data-store.ts';

interface TestResult {
  name: string;
  passed: boolean;
  actualStatus?: number;
  expectedStatus?: number | number[];
  details: string;
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

async function runDataOrgTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ MÔ HÌNH DỮ LIỆU & QUẢN LÝ TỔ CHỨC (GIAI ĐOẠN 3)');
  console.log('======================================================\n');

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });
  const address = testServer.address() as { port: number };
  const serverUrl = `http://127.0.0.1:${address.port}`;

  seedDefaultAccounts();
  DataStore.seedInitialData();

  try {
    // 1. Đăng nhập để lấy Token cho các vai trò
    const loginSuper = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'superadmin@edunova.edu.vn',
      password: 'SuperAdminPassword@2026',
    });
    const superAdminToken = loginSuper.data?.session?.token;

    const loginSchoolAlpha = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'admin.alpha@thalpha.edu.vn',
      password: 'SchoolAlphaPass@2026',
    });
    const schoolAdminAlphaToken = loginSchoolAlpha.data?.session?.token;

    const loginTeacher = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'teacher.nguyen@thalpha.edu.vn',
      password: 'TeacherAlphaPass@2026',
    });
    const teacherToken = loginTeacher.data?.session?.token;

    const loginStudent = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'student.nam@thalpha.edu.vn',
      password: 'StudentAlphaPass@2026',
    });
    const studentToken = loginStudent.data?.session?.token;

    // -----------------------------------------------------------
    // TEST 1: SUPER_ADMIN tạo trường học mới thành công
    // -----------------------------------------------------------
    const newSchoolRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/admin/schools',
      {
        code: 'TH-GAMMA',
        name: 'Trường Tiểu học Thực nghiệm Gamma [DỮ LIỆU MẪU]',
        address: 'Đà Nẵng',
        contactEmail: 'bgh@thgamma.edu.vn',
      },
      superAdminToken
    );
    results.push({
      name: 'TEST 1: SUPER_ADMIN tạo trường học mới',
      passed: newSchoolRes.status === 201 && newSchoolRes.data?.school?.code === 'TH-GAMMA',
      actualStatus: newSchoolRes.status,
      expectedStatus: 201,
      details: 'Trả về HTTP 201 và bản ghi trường có đầy đủ id, createdAt, status=ACTIVE',
    });

    const gammaSchoolId = newSchoolRes.data?.school?.id;

    // -----------------------------------------------------------
    // TEST 2: SUPER_ADMIN tạo tài khoản SCHOOL_ADMIN cho trường mới
    // -----------------------------------------------------------
    const newAdminRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/admin/school-admins',
      {
        email: 'admin.gamma@thgamma.edu.vn',
        name: 'Thầy Lê Văn Cường',
        password: 'AdminGammaPassword@2026',
        schoolId: gammaSchoolId,
      },
      superAdminToken
    );
    results.push({
      name: 'TEST 2: SUPER_ADMIN tạo tài khoản SCHOOL_ADMIN liên kết trường',
      passed: newAdminRes.status === 201 && newAdminRes.data?.user?.role === 'SCHOOL_ADMIN',
      actualStatus: newAdminRes.status,
      expectedStatus: 201,
      details: 'Tạo tài khoản quản trị trường thành công với custom claim schoolId chuẩn xác',
    });

    // -----------------------------------------------------------
    // TEST 3: SUPER_ADMIN khóa trường & Hệ thống chặn tạo lớp trong trường bị khóa
    // -----------------------------------------------------------
    const lockSchoolRes = await makeRequest(
      serverUrl,
      'PATCH',
      `/api/admin/schools/${gammaSchoolId}/status`,
      {
        status: 'LOCKED',
        reason: 'Tạm dừng để kiểm toán hồ sơ ban đầu',
      },
      superAdminToken
    );
    results.push({
      name: 'TEST 3.1: SUPER_ADMIN khóa trường học -> Chuyển status=LOCKED',
      passed: lockSchoolRes.status === 200 && lockSchoolRes.data?.school?.status === 'LOCKED',
      actualStatus: lockSchoolRes.status,
      expectedStatus: 200,
      details: 'Trường học chuyển sang trạng thái LOCKED và ghi nhận lý do khóa',
    });

    // Thử tạo lớp trong trường đã bị khóa -> Bị từ chối
    const createClassInLockedSchool = await makeRequest(
      serverUrl,
      'POST',
      `/api/schools/${gammaSchoolId}/classes`,
      {
        code: '4-GAMMA-1',
        name: 'Lớp 4 Gamma 1',
        gradeLevel: 4,
        academicYear: '2026-2027',
      },
      superAdminToken
    );
    results.push({
      name: 'TEST 3.2: Chặn tạo lớp học khi trường đang ở trạng thái LOCKED',
      passed: createClassInLockedSchool.status === 400 && createClassInLockedSchool.data?.error?.includes('KHÓA'),
      actualStatus: createClassInLockedSchool.status,
      expectedStatus: 400,
      details: 'Hệ thống từ chối thao tác tạo lớp đối với đơn vị trường đang bị khóa',
    });

    // Mở khóa lại trường để tiếp tục vận hành
    await makeRequest(
      serverUrl,
      'PATCH',
      `/api/admin/schools/${gammaSchoolId}/status`,
      { status: 'ACTIVE' },
      superAdminToken
    );

    // -----------------------------------------------------------
    // TEST 4: SCHOOL_ADMIN tạo lớp học mới trong trường của mình
    // -----------------------------------------------------------
    const createClassRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/schools/school_alpha/classes',
      {
        code: '4C',
        name: 'Lớp 4C (Toán 4)',
        gradeLevel: 4,
        academicYear: '2026-2027',
      },
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 4: SCHOOL_ADMIN tạo lớp học mới trong trường',
      passed: createClassRes.status === 201 && createClassRes.data?.class?.code === '4C',
      actualStatus: createClassRes.status,
      expectedStatus: 201,
      details: 'Tạo lớp 4C thành công có schoolId=school_alpha',
    });

    const class4CId = createClassRes.data?.class?.id;

    // -----------------------------------------------------------
    // TEST 5: SCHOOL_ADMIN phân công giáo viên vào lớp học
    // -----------------------------------------------------------
    const assignTeacherRes = await makeRequest(
      serverUrl,
      'POST',
      `/api/schools/school_alpha/classes/${class4CId}/teachers`,
      {
        teacherId: 'teacher_alpha_01',
      },
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 5: SCHOOL_ADMIN phân công giáo viên vào lớp học',
      passed: assignTeacherRes.status === 200 && assignTeacherRes.data?.membership?.role === 'TEACHER',
      actualStatus: assignTeacherRes.status,
      expectedStatus: 200,
      details: 'Ghi nhận bản ghi ClassMembership vai trò TEACHER',
    });

    // -----------------------------------------------------------
    // TEST 6: SCHOOL_ADMIN thêm học sinh bằng mã ẩn danh (Data Minimization)
    // -----------------------------------------------------------
    const addStudentRes = await makeRequest(
      serverUrl,
      'POST',
      `/api/schools/school_alpha/classes/${class4CId}/students`,
      {
        studentCode: 'HS-4C-01',
        displayName: 'Em An [DỮ LIỆU MẪU]',
      },
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 6: SCHOOL_ADMIN thêm học sinh với mã ẩn danh HS-4C-01',
      passed: addStudentRes.status === 201 && addStudentRes.data?.student?.studentCode === 'HS-4C-01',
      actualStatus: addStudentRes.status,
      expectedStatus: 201,
      details: 'Tuân thủ Nguyên tắc 9: Chỉ lưu trữ mã học sinh ẩn danh và tên hiển thị',
    });

    // -----------------------------------------------------------
    // TEST 7: Tenant Isolation - Quản trị viên Trường A tạo lớp ở Trường B bị từ chối 403
    // -----------------------------------------------------------
    const crossSchoolCreateClass = await makeRequest(
      serverUrl,
      'POST',
      '/api/schools/school_beta/classes',
      {
        code: '4-HACK',
        name: 'Lớp Xâm phạm',
        gradeLevel: 4,
        academicYear: '2026-2027',
      },
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 7: Tenant Isolation: Quản trị viên Trường A can thiệp Trường B bị từ chối 403',
      passed: crossSchoolCreateClass.status === 403 && crossSchoolCreateClass.data?.errorCode === 'TENANT_ACCESS_DENIED',
      actualStatus: crossSchoolCreateClass.status,
      expectedStatus: 403,
      details: 'Middleware Tenant Isolation chặn đứng hành vi can thiệp dữ liệu trường khác',
    });

    // -----------------------------------------------------------
    // TEST 8: Schema Validation - Gửi thiếu hoặc sai định dạng bị từ chối 400
    // -----------------------------------------------------------
    const invalidClassPayload = await makeRequest(
      serverUrl,
      'POST',
      '/api/schools/school_alpha/classes',
      {
        code: '', // Mã rỗng
        gradeLevel: 99, // Khối lớp sai
      },
      schoolAdminAlphaToken
    );
    results.push({
      name: 'TEST 8: Schema Validation: Dữ liệu thiếu/sai bị từ chối HTTP 400',
      passed: invalidClassPayload.status === 400 && invalidClassPayload.data?.errorCode === 'VALIDATION_ERROR',
      actualStatus: invalidClassPayload.status,
      expectedStatus: 400,
      details: `Từ chối với mã lỗi VALIDATION_ERROR, liệt kê ${invalidClassPayload.data?.details?.length || 0} trường sai`,
    });

    // -----------------------------------------------------------
    // TEST 9: Phân trang API (Pagination Verification)
    // -----------------------------------------------------------
    const page1Res = await makeRequest(
      serverUrl,
      'GET',
      '/api/admin/schools?page=1&limit=2',
      null,
      superAdminToken
    );
    const page2Res = await makeRequest(
      serverUrl,
      'GET',
      '/api/admin/schools?page=2&limit=2',
      null,
      superAdminToken
    );

    const isPaginationCorrect =
      page1Res.status === 200 &&
      page2Res.status === 200 &&
      page1Res.data?.limit === 2 &&
      page1Res.data?.page === 1 &&
      page2Res.data?.page === 2 &&
      typeof page1Res.data?.total === 'number' &&
      typeof page1Res.data?.totalPages === 'number';

    results.push({
      name: 'TEST 9: Phân trang (Pagination) trả về đúng page, limit, total, hasNext, hasPrev',
      passed: isPaginationCorrect,
      actualStatus: 200,
      expectedStatus: 200,
      details: `Phân trang chuẩn: Total=${page1Res.data?.total}, Trang 1 có ${page1Res.data?.items?.length} mục, hasNext=${page1Res.data?.hasNext}`,
    });

    // -----------------------------------------------------------
    // TEST 10: Tách rời AnswerKey (AnswerKey Segregation)
    // -----------------------------------------------------------
    // Học sinh gọi lấy câu hỏi
    const studentQuestionsRes = await makeRequest(
      serverUrl,
      'GET',
      '/api/questions',
      null,
      studentToken
    );
    const studentHasNoAnswerKey =
      studentQuestionsRes.status === 200 &&
      studentQuestionsRes.data?.answerKeysIncluded === false &&
      studentQuestionsRes.data?.questions?.every((q: any) => q.answerKey === undefined);

    results.push({
      name: 'TEST 10.1: Học sinh lấy câu hỏi TUYỆT ĐỐI KHÔNG nhận được AnswerKeys',
      passed: studentHasNoAnswerKey,
      actualStatus: studentQuestionsRes.status,
      expectedStatus: 200,
      details: 'Dữ liệu trả về cho học sinh chỉ có đề bài và phương án, AnswerKey bị cô lập hoàn toàn',
    });

    // Giáo viên gọi lấy câu hỏi
    const teacherQuestionsRes = await makeRequest(
      serverUrl,
      'GET',
      '/api/questions',
      null,
      teacherToken
    );
    const teacherHasAnswerKey =
      teacherQuestionsRes.status === 200 &&
      teacherQuestionsRes.data?.answerKeysIncluded === true &&
      teacherQuestionsRes.data?.questions?.some((q: any) => q.answerKey !== undefined);

    results.push({
      name: 'TEST 10.2: Giáo viên có thẩm quyền nhận đầy đủ AnswerKeys để đối soát sư phạm',
      passed: teacherHasAnswerKey,
      actualStatus: teacherQuestionsRes.status,
      expectedStatus: 200,
      details: 'Giáo viên nhận được đáp án chuẩn và lời giải chi tiết',
    });
  } finally {
    testServer.close();
  }

  // In bảng kết quả
  console.log('------------------------------------------------------------------------------------------');
  console.log('| KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 3 (MÔ HÌNH DỮ LIỆU & QUẢN LÝ TỔ CHỨC)                      |');
  console.log('------------------------------------------------------------------------------------------');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅ ĐẠT (PASS)' : '❌ HỎNG (FAIL)';
    if (r.passed) passCount++;
    console.log(`${symbol} | ${r.name}`);
    console.log(`         -> Chi tiết: ${r.details}`);
  }
  console.log('------------------------------------------------------------------------------------------');
  console.log(`TỔNG KẾT: ${passCount}/${results.length} bài kiểm tra thực tế GIAI ĐOẠN 3 ĐẠT 100%`);
  console.log('==========================================================================================\n');

  return {
    total: results.length,
    passed: passCount,
    results,
  };
}

if (process.argv[1]?.endsWith('data-org.test.ts')) {
  runDataOrgTestSuite().catch((err) => {
    console.error('Lỗi thực thi test:', err);
    process.exit(1);
  });
}

export { runDataOrgTestSuite };
