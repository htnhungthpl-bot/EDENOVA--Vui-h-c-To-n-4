/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { app } from '../../server.ts';
import { UserStore } from '../services/user-store.ts';
import { TokenService } from '../auth/token-service.ts';
import { CurriculumStore } from '../db/curriculum-store.ts';
import { DataStore } from '../db/data-store.ts';
import { AuditService } from '../services/audit-service.ts';
import { ReportingService } from '../services/reporting-service.ts';

function makeAuthToken(user: any): string {
  const session = TokenService.generateSession({
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    assignedClassIds: user.assignedClassIds,
    status: user.status,
  });
  return session.token;
}

function makeRequest(
  baseUrl: string,
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
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
        resolve({
          status: res.statusCode || 500,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runReportingTests() {
  console.log('======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ BÁO CÁO GIÁO VIÊN & QUẢN TRỊ (GIAI ĐOẠN 7)');
  console.log('======================================================');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const serverUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ ĐẠT (PASS) | ${testName}`);
      console.log(`         -> Chi tiết: ${detail}`);
    } else {
      console.error(`❌ THẤT BẠI (FAIL) | ${testName}`);
      console.error(`         -> Chi tiết lỗi: ${detail}`);
    }
  }

  try {
    const superAdmin = UserStore.findByEmail('superadmin@edunova.edu.vn')!;
    const schoolAdminAlpha = UserStore.findByEmail('admin.alpha@thalpha.edu.vn')!;
    const teacherAlpha = UserStore.findByEmail('teacher.nguyen@thalpha.edu.vn')!;
    const studentNam = UserStore.findByEmail('student.nam@thalpha.edu.vn')!;
    const reviewer = UserStore.findByEmail('reviewer.toan@edunova.edu.vn')!;

    const superAdminToken = makeAuthToken(superAdmin);
    const schoolAdminAlphaToken = makeAuthToken(schoolAdminAlpha);
    const teacherAlphaToken = makeAuthToken(teacherAlpha);
    const studentNamToken = makeAuthToken(studentNam);

    // Chuẩn bị dữ liệu mẫu chuẩn: Duyệt bài học
    CurriculumStore.approveLesson('lesson_01', reviewer.email);
    CurriculumStore.approveLesson('lesson_02', reviewer.email);

    // 1. Tạo bài tập cho Lớp 4A
    const asg1 = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: teacherAlpha.uid,
      lessonId: 'lesson_01',
      title: 'Bài tập Báo cáo 1: Ôn tập các số đến 100 000',
      instructions: 'Đọc kỹ hàng và lớp',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    // 2. Học sinh nộp bài tập (2 đúng, 1 sai để có dữ liệu dạng lỗi)
    const subRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: asg1.id,
        classId: 'school_alpha_4A',
        answers: [
          { questionId: 'q_mc_01', answer: 'A' }, // Sai (Đáp án đúng C -> lỗi PLACE_VALUE)
          { questionId: 'q_fib_01', answer: 90000 }, // Đúng
          { questionId: 'q_tf_01', answer: true }, // Đúng
        ],
      },
      studentNamToken
    );

    // ------------------------------------------------------------------------
    // TEST 1: Số liệu báo cáo giáo viên khớp dữ liệu nguồn trong bộ dữ liệu mẫu
    // ------------------------------------------------------------------------
    const resClassReport = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/class/school_alpha_4A',
      null,
      teacherAlphaToken
    );

    const cr = resClassReport.body.report;
    const isMatched =
      resClassReport.status === 200 &&
      cr.classId === 'school_alpha_4A' &&
      cr.hasData === true &&
      cr.totalStudents >= 1 &&
      cr.totalSubmissions >= 1 &&
      cr.assignmentSummaries.length >= 1;

    assert(
      isMatched,
      'TEST 1: Số liệu báo cáo giáo viên khớp dữ liệu nguồn trong bộ dữ liệu mẫu',
      `Lớp ${cr.className}: Tổng học sinh: ${cr.totalStudents}, Số bài tập: ${cr.totalAssignments}, Bài nộp: ${cr.totalSubmissions}, Độ chính xác TB: ${cr.overallClassAccuracy}%.`
    );

    // ------------------------------------------------------------------------
    // TEST 2: Thống kê tỷ lệ đúng theo từng câu & Dạng lỗi phổ biến của lớp
    // ------------------------------------------------------------------------
    const hasQuestionsBreakdown = cr.questionAccuracyBreakdown.length >= 3;
    const hasErrorPatterns = cr.commonErrorPatterns.some((e: any) => e.errorTag === 'PLACE_VALUE');

    assert(
      hasQuestionsBreakdown && hasErrorPatterns,
      'TEST 2: Thống kê tỷ lệ đúng theo câu và dạng lỗi sai phổ biến toàn lớp',
      `Phân tích ${cr.questionAccuracyBreakdown.length} câu hỏi. Dạng lỗi phổ biến: PLACE_VALUE (${cr.commonErrorPatterns[0]?.errorLabel} - ${cr.commonErrorPatterns[0]?.count} lần).`
    );

    // ------------------------------------------------------------------------
    // TEST 3: Danh sách học sinh cần hỗ trợ theo tiêu chí hiển thị rõ ràng trên giao diện
    // ------------------------------------------------------------------------
    const hasSupportStudents = cr.studentsNeedingSupport.length > 0;
    const supportItem = cr.studentsNeedingSupport[0];
    const hasClearCriteria =
      supportItem &&
      typeof supportItem.triggerCriteria === 'string' &&
      supportItem.triggerCriteria.length > 5 &&
      typeof supportItem.suggestedAction === 'string';

    assert(
      hasSupportStudents && hasClearCriteria,
      'TEST 3: Danh sách học sinh cần hỗ trợ sư phạm theo tiêu chí minh bạch',
      `Học sinh: ${supportItem?.studentName} - Tiêu chí kích hoạt: "${supportItem?.triggerCriteria}" - Khuyến nghị: "${supportItem?.suggestedAction.slice(0, 50)}..."`
    );

    // ------------------------------------------------------------------------
    // TEST 4: Giáo viên không xem được lớp khác (Phân quyền bảo mật tuyệt đối)
    // ------------------------------------------------------------------------
    // Tạo lớp 4B trong trường Alpha mà giáo viên Alpha không được phân công
    const resForbiddenClass = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/class/school_alpha_4B',
      null,
      teacherAlphaToken
    );

    assert(
      resForbiddenClass.status === 403,
      'TEST 4: Giáo viên bị từ chối (HTTP 403) khi cố truy cập báo cáo lớp khác',
      `Quyền bị từ chối chính xác: Giáo viên teacher.nguyen không có quyền xem lớp school_alpha_4B.`
    );

    // ------------------------------------------------------------------------
    // TEST 5: Xuất dữ liệu (CSV) bảng điểm lớp khi có quyền & Ghi nhận AuditLogs
    // ------------------------------------------------------------------------
    const logsBefore = AuditService.query({ requesterRole: 'SUPER_ADMIN', limit: 200 }).length;

    const resExportCsv = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/class/school_alpha_4A/export-csv',
      null,
      teacherAlphaToken
    );

    const isCsvContentType =
      String(resExportCsv.headers['content-type']).includes('text/csv');
    const isCsvContentValid =
      typeof resExportCsv.body === 'string' &&
      resExportCsv.body.includes('BÁO CÁO KẾT QUẢ HỌC TẬP LỚP') &&
      resExportCsv.body.includes('Mã học sinh,Tên học sinh');

    const logsAfter = AuditService.query({ requesterRole: 'SUPER_ADMIN', limit: 200 });
    const hasExportAudit = logsAfter.some(
      (l) => l.action === 'EXPORT_CLASS_REPORT_CSV' && l.actorRole === 'TEACHER'
    );

    assert(
      resExportCsv.status === 200 && isCsvContentType && isCsvContentValid && hasExportAudit,
      'TEST 5: Xuất dữ liệu CSV bảng điểm lớp hợp lệ và đã ghi nhận vào AuditLogs',
      `HTTP 200 text/csv (dung lượng ${resExportCsv.body.length} ký tự). AuditLog ghi nhận thành công action: EXPORT_CLASS_REPORT_CSV.`
    );

    // ------------------------------------------------------------------------
    // TEST 6: Xuất dữ liệu bị chặn (403/401) khi không đủ quyền
    // ------------------------------------------------------------------------
    // Học sinh cố tình gọi API xuất CSV của lớp
    const resStudentExportBlocked = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/class/school_alpha_4A/export-csv',
      null,
      studentNamToken
    );

    assert(
      resStudentExportBlocked.status === 403,
      'TEST 6: Học sinh bị chặn ngay lập tức (HTTP 403) khi cố tình xuất dữ liệu báo cáo',
      `Học sinh không có quyền truy cập endpoint xuất CSV báo cáo (Mã lỗi HTTP 403 FORBIDDEN).`
    );

    // ------------------------------------------------------------------------
    // TEST 7: Báo cáo trường (SCHOOL_ADMIN) tổng hợp trong phạm vi trường
    // ------------------------------------------------------------------------
    const resSchoolReport = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/school/school_alpha',
      null,
      schoolAdminAlphaToken
    );

    const sr = resSchoolReport.body.report;
    const isSchoolValid =
      resSchoolReport.status === 200 &&
      sr.schoolId === 'school_alpha' &&
      sr.totalClasses >= 1 &&
      sr.totalTeachers >= 1 &&
      sr.classSummaries.length >= 1;

    assert(
      isSchoolValid,
      'TEST 7: Báo cáo trường (SCHOOL_ADMIN) tổng hợp dữ liệu chuẩn trong phạm vi trường',
      `Trường: ${sr.schoolName} - Tổng ${sr.totalClasses} lớp, ${sr.totalTeachers} giáo viên, ${sr.totalStudents} học sinh. Điểm TB trường: ${sr.schoolAverageAccuracy}%.`
    );

    // ------------------------------------------------------------------------
    // TEST 8: Báo cáo quản trị (SUPER_ADMIN): Tài khoản, Dịch vụ, AI & Chi phí
    // ------------------------------------------------------------------------
    const resAdminReport = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/admin/overview',
      null,
      superAdminToken
    );

    const ar = resAdminReport.body.report;
    const hasAccounts = ar.activeAccounts.totalUsers >= 5;
    const hasHealth = ar.serviceHealth.length >= 4;
    const hasAiUsage =
      typeof ar.aiUsageAndCost.totalCalls === 'number' &&
      typeof ar.aiUsageAndCost.estimatedCostUsd === 'number' &&
      ar.aiUsageAndCost.costFormula.includes('Chi phí =');

    assert(
      resAdminReport.status === 200 && hasAccounts && hasHealth && hasAiUsage,
      'TEST 8: Báo cáo SUPER_ADMIN: Tài khoản hoạt động, trạng thái dịch vụ, chi phí AI có công thức',
      `Tài khoản: ${ar.activeAccounts.activeUsers} hoạt động. Dịch vụ: ${ar.serviceHealth.length} services. AI calls: ${ar.aiUsageAndCost.totalCalls}, Chi phí ước tính: $${ar.aiUsageAndCost.estimatedCostUsd} USD (${ar.aiUsageAndCost.estimatedCostVnd.toLocaleString('vi-VN')} VND).`
    );

    // ------------------------------------------------------------------------
    // TEST 9: SUPER_ADMIN xem nhật ký thao tác quan trọng có phân trang chuẩn
    // ------------------------------------------------------------------------
    const resAuditPaginated = await makeRequest(
      serverUrl,
      'GET',
      '/api/reports/admin/audit-logs?page=1&limit=5',
      null,
      superAdminToken
    );

    const p = resAuditPaginated.body.pagination;
    const isPaginated =
      resAuditPaginated.status === 200 &&
      p.page === 1 &&
      p.limit === 5 &&
      p.totalItems > 0 &&
      Array.isArray(resAuditPaginated.body.logs) &&
      resAuditPaginated.body.logs.length <= 5;

    assert(
      isPaginated,
      'TEST 9: SUPER_ADMIN truy vấn nhật ký kiểm toán quan trọng (Audit Logs) có phân trang',
      `Trang ${p.page}/${p.totalPages} (Hiển thị ${resAuditPaginated.body.logs.length} bản ghi / Tổng ${p.totalItems} bản ghi kiểm toán).`
    );

    // ------------------------------------------------------------------------
    // TEST 10: Ca chưa có dữ liệu -> Trả về thông báo "Chưa có dữ liệu" trung thực
    // ------------------------------------------------------------------------
    // Tạo một lớp mới tinh chưa có bài tập và bài nộp
    const emptyClass = DataStore.createClass('school_alpha', {
      name: 'Lớp 4C Thực nghiệm',
      code: 'school_alpha_4C',
      gradeLevel: 4,
      academicYear: '2025-2026',
    });

    const resEmptyClass = await makeRequest(
      serverUrl,
      'GET',
      `/api/reports/class/${emptyClass.id}`,
      null,
      superAdminToken
    );

    const emptyReport = resEmptyClass.body.report;
    const isHonestEmpty =
      resEmptyClass.status === 200 &&
      emptyReport.hasData === false &&
      emptyReport.statusMessage?.includes('Chưa có dữ liệu bài làm') &&
      emptyReport.totalSubmissions === 0;

    assert(
      isHonestEmpty,
      'TEST 10: Ràng buộc trung thực: Lớp chưa có bài làm hiển thị rõ "Chưa có dữ liệu"',
      `Trạng thái: hasData=false, Thông điệp: "${emptyReport?.statusMessage}". Tuyệt đối không tạo số liệu giả mạo.`
    );

    console.log('------------------------------------------------------------------------------------------');
    console.log(`TỔNG KẾT: ${passed}/${total} bài kiểm tra thực tế GIAI ĐOẠN 7 ĐẠT ${(passed / total) * 100}%`);
    console.log('==========================================================================================');
  } finally {
    server.close();
  }

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runReportingTests().catch((err) => {
  console.error('Fatal error in reporting tests:', err);
  process.exit(1);
});
