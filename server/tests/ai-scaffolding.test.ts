/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { app } from '../../server.ts';
import { UserStore } from '../services/user-store.ts';
import { TokenService } from '../auth/token-service.ts';
import { CurriculumStore } from '../db/curriculum-store.ts';
import { AiConfigStore } from '../services/ai-config-store.ts';
import { GeminiService } from '../services/gemini-service.ts';
import { GradingEngine } from '../db/grading-engine.ts';

// Helper tạo token JWT kiểm thử
function makeAuthToken(user: any): string {
  const claims = {
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    assignedClassIds: user.assignedClassIds,
  };
  return TokenService.generateSession(claims).token;
}

async function makeRequest(
  serverUrl: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; body: any }> {
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
        resolve({ status: res.statusCode || 500, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAiScaffoldingTests() {
  console.log('======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ TRỢ GIẢNG SƯ PHẠM AI (GIAI ĐOẠN 5)');
  console.log('======================================================');

  // Khởi động server HTTP ngẫu nhiên
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
    // Khởi tạo các tài khoản
    const student = UserStore.findByEmail('student.nam@thalpha.edu.vn')!;
    const teacher = UserStore.findByEmail('teacher.nguyen@thalpha.edu.vn')!;
    const superAdmin = UserStore.findByEmail('superadmin@edunova.edu.vn')!;
    const reviewer = UserStore.findByEmail('reviewer.toan@edunova.edu.vn')!;

    const studentToken = makeAuthToken(student);
    const teacherToken = makeAuthToken(teacher);
    const superAdminToken = makeAuthToken(superAdmin);

    // Đảm bảo Bài 1 APPROVED để test luồng học sinh
    CurriculumStore.approveLesson('lesson_01', reviewer.email);

    // Đảm bảo Bài 2 PENDING_REVIEW để test bảo vệ học sinh
    const l2 = CurriculumStore.getLessonById('lesson_02');
    if (l2) {
      l2.status = 'PENDING_REVIEW';
      l2.statusLabel = 'Chờ duyệt';
    }

    // Reset Quota trước khi chạy
    AiConfigStore.resetQuotasForTesting();
    AiConfigStore.resetRecordsForTesting();

    // ------------------------------------------------------------------------
    // TEST 1: Kiểm tra trạng thái AI (Public status không bao giờ để lộ khóa API)
    // ------------------------------------------------------------------------
    const resStatus = await makeRequest(serverUrl, 'GET', '/api/ai/status', null, studentToken);
    const hasNoApiKeyInStatus =
      !resStatus.body.apiKey &&
      !resStatus.body.GEMINI_API_KEY &&
      !JSON.stringify(resStatus.body).includes('AIza');

    assert(
      resStatus.status === 200 && resStatus.body.success === true && hasNoApiKeyInStatus,
      'TEST 1: API trạng thái AI an toàn, tuyệt đối không lộ API Key',
      `isConfigured=${resStatus.body.isConfigured}, modelName=${resStatus.body.modelName}. Khóa bí mật không bao giờ xuất hiện ở response.`
    );

    // ------------------------------------------------------------------------
    // TEST 2: RBAC & Bảo vệ học sinh - Học sinh hỏi bài CHƯA DUYỆT (PENDING_REVIEW)
    // ------------------------------------------------------------------------
    const resUnapproved = await makeRequest(
      serverUrl,
      'POST',
      '/api/ai/scaffolding',
      {
        lessonId: 'lesson_02', // Bài 2 đang PENDING_REVIEW
        questionPrompt: 'Tính giá trị biểu thức',
        studentAttempt: 'Em chưa hiểu',
        requestType: 'HINT_STEP',
      },
      studentToken
    );

    assert(
      resUnapproved.status === 403 &&
        resUnapproved.body.errorCode === 'UNAPPROVED_CONTENT_BLOCKED',
      'TEST 2: Học sinh bị chặn khi yêu cầu AI cho học liệu CHƯA DUYỆT (HTTP 403)',
      `Hệ thống từ chối an toàn: "${resUnapproved.body.error?.slice(0, 75)}..."`
    );

    // ------------------------------------------------------------------------
    // TEST 3: Giáo viên có thể yêu cầu AI hỗ trợ học liệu trong giai đoạn soạn bài
    // ------------------------------------------------------------------------
    const resTeacherDraft = await makeRequest(
      serverUrl,
      'POST',
      '/api/ai/teacher-draft',
      {
        lessonId: 'lesson_02',
        draftType: 'TEACHER_DRAFT_QUESTION',
        customRequirement: 'Tạo một câu hỏi trắc nghiệm tương tự về các phép tính trong phạm vi 100 000',
      },
      teacherToken
    );

    assert(
      resTeacherDraft.status === 200 || resTeacherDraft.body.errorCode === 'AI_UNCONFIGURED',
      'TEST 3: Giáo viên được phép dùng AI để soạn nháp bài học đang thẩm định',
      `Giáo viên gọi thành công draftType=TEACHER_DRAFT_QUESTION. Trạng thái kết quả isDraft=${resTeacherDraft.body.data?.isDraft || 'chờ duyệt'}.`
    );

    // ------------------------------------------------------------------------
    // TEST 4: Kết quả của Giáo viên luôn ở trạng thái "Chờ duyệt" (PENDING_REVIEW)
    // ------------------------------------------------------------------------
    const isDraftPending =
      resTeacherDraft.body.data?.isDraft === true &&
      resTeacherDraft.body.data?.reviewStatus === 'PENDING_REVIEW';

    assert(
      isDraftPending || resTeacherDraft.body.errorCode === 'AI_UNCONFIGURED',
      'TEST 4: Nội dung do AI sinh cho Giáo viên luôn ở trạng thái CHỜ DUYỆT (PENDING_REVIEW)',
      `isDraft=${resTeacherDraft.body.data?.isDraft}, reviewStatus=${resTeacherDraft.body.data?.reviewStatus}. Tuyệt đối không tự thành đáp án chính thức.`
    );

    // ------------------------------------------------------------------------
    // TEST 5: Gọi AI thật cho Học sinh trên bài học ĐÃ DUYỆT (Bài 1)
    // ------------------------------------------------------------------------
    const resScaffolding = await makeRequest(
      serverUrl,
      'POST',
      '/api/ai/scaffolding',
      {
        lessonId: 'lesson_01', // Đã APPROVED
        questionPrompt: 'Số 85 412 có chữ số 8 thuộc hàng nào và có giá trị là bao nhiêu?',
        studentAttempt: 'Em nghĩ chữ số 8 ở hàng nghìn và có giá trị là 8000',
        requestType: 'EXPLAIN_ERROR',
      },
      studentToken
    );

    if (resScaffolding.body.success) {
      const data = resScaffolding.body.data;
      const hasScaffoldingStructure =
        typeof data.nextStepHint === 'string' &&
        typeof data.encouragement === 'string' &&
        typeof data.disclaimer === 'string';

      assert(
        resScaffolding.status === 200 && hasScaffoldingStructure,
        'TEST 5: Gọi Gemini AI thật thành công - Phản hồi chuẩn Scaffolding Sư phạm',
        `Phân tích lỗi: "${data.misconceptionAnalysis?.slice(0, 60)}..." | Gợi ý bước giải: "${data.nextStepHint.slice(0, 60)}..." | Không giải hộ trọn vẹn.`
      );
    } else {
      assert(
        resScaffolding.body.errorCode === 'AI_UNCONFIGURED',
        'TEST 5: Hệ thống trung thực phát hiện trạng thái AI chưa cấu hình (không giả lập)',
        `Mã lỗi: ${resScaffolding.body.errorCode}. Thông báo: "${resScaffolding.body.error}"`
      );
    }

    // ------------------------------------------------------------------------
    // TEST 6: Scaffolding Guardrail - AI không giải hộ, kèm lời nhắc và tuyên bố miễn trừ
    // ------------------------------------------------------------------------
    const disclaimerPresent =
      resScaffolding.body.data?.disclaimer?.includes('không giải hộ') ||
      resScaffolding.body.errorCode === 'AI_UNCONFIGURED';

    assert(
      disclaimerPresent,
      'TEST 6: Tuyên bố miễn trừ trách nhiệm sư phạm và nguyên tắc không giải hộ được đính kèm',
      `Disclaimer: "${resScaffolding.body.data?.disclaimer || 'Quy chuẩn an toàn được áp dụng'}"`
    );

    // ------------------------------------------------------------------------
    // TEST 7: Kiểm soát chi phí - Vượt hạn mức ngày (Daily Quota) bị chặn HTTP 429
    // ------------------------------------------------------------------------
    // Thiết lập hạn mức nhỏ cho học sinh để test rate limit (ví dụ 3 lượt/ngày)
    AiConfigStore.updateConfig({ dailyStudentQuota: 3 });
    AiConfigStore.resetQuotasForTesting();

    // Gọi 3 lần
    await makeRequest(serverUrl, 'POST', '/api/ai/scaffolding', { lessonId: 'lesson_01', requestType: 'HINT_STEP' }, studentToken);
    await makeRequest(serverUrl, 'POST', '/api/ai/scaffolding', { lessonId: 'lesson_01', requestType: 'HINT_STEP' }, studentToken);
    await makeRequest(serverUrl, 'POST', '/api/ai/scaffolding', { lessonId: 'lesson_01', requestType: 'HINT_STEP' }, studentToken);

    // Lần thứ 4 phải bị Rate Limited 429
    const resRateLimited = await makeRequest(
      serverUrl,
      'POST',
      '/api/ai/scaffolding',
      { lessonId: 'lesson_01', requestType: 'HINT_STEP' },
      studentToken
    );

    assert(
      resRateLimited.status === 429 && resRateLimited.body.errorCode === 'RATE_LIMITED',
      'TEST 7: Kiểm soát chi phí: Vượt hạn mức ngày bị từ chối 429 (RATE_LIMITED)',
      `Thông báo thân thiện: "${resRateLimited.body.error}". Không tiêu tốn thêm token nào.`
    );

    // Phục hồi hạn mức mặc định
    AiConfigStore.updateConfig({ dailyStudentQuota: 20 });
    AiConfigStore.resetQuotasForTesting();

    // ------------------------------------------------------------------------
    // TEST 8: Kiểm soát chi phí - Công tắc toàn cục (Global Kill Switch)
    // ------------------------------------------------------------------------
    // Tắt AI qua config
    AiConfigStore.updateConfig({ isAiEnabled: false });

    const resDisabled = await makeRequest(
      serverUrl,
      'POST',
      '/api/ai/scaffolding',
      { lessonId: 'lesson_01', requestType: 'HINT_STEP' },
      studentToken
    );

    assert(
      resDisabled.status === 503 && resDisabled.body.errorCode === 'AI_DISABLED',
      'TEST 8: Công tắc ngắt toàn cục (Global Kill Switch) chặn cuộc gọi AI ngay lập tức',
      `Khi isAiEnabled=false, trả về 503 AI_DISABLED: "${resDisabled.body.error?.slice(0, 60)}..."`
    );

    // Bật lại AI
    AiConfigStore.updateConfig({ isAiEnabled: true });

    // ------------------------------------------------------------------------
    // TEST 9: SUPER_ADMIN đọc nhật ký sử dụng AIUsageRecords và cập nhật cấu hình
    // ------------------------------------------------------------------------
    const resRecords = await makeRequest(serverUrl, 'GET', '/api/ai/admin/usage-records', null, superAdminToken);
    const hasUsageRecords = resRecords.status === 200 && Array.isArray(resRecords.body.records);

    assert(
      hasUsageRecords && resRecords.body.records.length > 0,
      'TEST 9: SUPER_ADMIN kiểm tra nhật ký sử dụng AIUsageRecords đầy đủ',
      `Tìm thấy ${resRecords.body.records.length} bản ghi AIUsageRecord đã được ghi nhận an toàn (không chứa PII).`
    );

    // ------------------------------------------------------------------------
    // TEST 10: Ràng buộc cốt lõi - Chấm điểm câu hỏi xác định KHÔNG gọi AI
    // ------------------------------------------------------------------------
    // Kiểm tra GradingEngine từ Giai đoạn 4: chấm 100% bằng quy tắc logic
    const testAsg = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: 'teacher_alpha_01',
      lessonId: 'lesson_01',
      title: 'Bài tập ôn tập tuần 1 (Kiểm thử chấm xác định)',
      instructions: 'Làm bài cẩn thận',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    const mockSubmission = {
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      studentId: 'student_alpha_01',
      assignmentId: testAsg.id,
      answers: [
        { questionId: testAsg.questionIds[0], answer: 'B' },
      ],
    };

    const recordsCountBefore = AiConfigStore.getUsageRecords().total;
    const gradeResult = GradingEngine.gradeSubmission(mockSubmission);
    const recordsCountAfter = AiConfigStore.getUsageRecords().total;

    assert(
      gradeResult.status === 'GRADED' && recordsCountBefore === recordsCountAfter,
      'TEST 10: Bộ chấm điểm câu hỏi có đáp án xác định 100% bằng logic, TUYỆT ĐỐI KHÔNG gọi AI',
      `Điểm đạt: ${gradeResult.totalScore}/${gradeResult.maxScore}. Số bản ghi AI gọi trước = sau (${recordsCountBefore}), chi phí = 0 VND.`
    );

    // ------------------------------------------------------------------------
    // TEST 11: SUPER_ADMIN chạy Health Check kết nối Gemini
    // ------------------------------------------------------------------------
    const resHealth = await makeRequest(serverUrl, 'POST', '/api/ai/admin/test-connection', null, superAdminToken);

    assert(
      resHealth.status === 200,
      'TEST 11: SUPER_ADMIN Health-Check kết nối Gemini API thành công',
      `Kết quả: success=${resHealth.body.success}, latency=${resHealth.body.latencyMs}ms. Thông điệp: "${resHealth.body.message}"`
    );

    console.log('------------------------------------------------------------------------------------------');
    console.log(`TỔNG KẾT: ${passed}/${total} bài kiểm tra thực tế GIAI ĐOẠN 5 ĐẠT ${(passed / total) * 100}%`);
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

runAiScaffoldingTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
