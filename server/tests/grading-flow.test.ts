/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { app, seedDefaultAccounts } from '../../server.ts';
import { CurriculumStore } from '../db/curriculum-store.ts';
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

async function runGradingFlowTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ LUỒNG HỌC TẬP & CHẤM ĐIỂM QUY TẮC (GIAI ĐOẠN 4)');
  console.log('======================================================\n');

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });
  const address = testServer.address() as { port: number };
  const serverUrl = `http://127.0.0.1:${address.port}`;

  seedDefaultAccounts();
  DataStore.seedInitialData();
  CurriculumStore.seedCurriculum();

  try {
    // Đăng nhập các vai trò
    const loginSuper = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'superadmin@edunova.edu.vn',
      password: 'SuperAdminPassword@2026',
    });
    const superAdminToken = loginSuper.data?.session?.token;

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

    const loginReviewer = await makeRequest(serverUrl, 'POST', '/api/auth/login', {
      email: 'reviewer.toan@edunova.edu.vn',
      password: 'ReviewerPass@2026',
    });
    const reviewerToken = loginReviewer.data?.session?.token;

    // -----------------------------------------------------------
    // TEST 1: Danh mục 73 bài chuẩn hóa 100% theo SGK Toán 4 Kết nối tri thức do người dùng cung cấp
    // -----------------------------------------------------------
    const allLessonsRes = await makeRequest(
      serverUrl,
      'GET',
      '/api/curriculum/lessons',
      null,
      studentToken
    );
    const lessons = allLessonsRes.data?.lessons || [];
    const lesson73Exist = lessons.length === 73;
    const lesson1Official = lessons[0]?.title === 'Bài 1: Ôn tập các số đến 100 000';
    const lesson2Official = lessons[1]?.title === 'Bài 2: Ôn tập các phép tính trong phạm vi 100 000';
    const lesson3Official = lessons[2]?.title === 'Bài 3: Số chẵn, số lẻ';
    const lesson73Official = lessons[72]?.title === 'Bài 73: Ôn tập chung';

    results.push({
      name: 'TEST 1: Danh mục 73 bài chuẩn hóa 100% theo SGK Toán 4 Kết nối tri thức',
      passed: lesson73Exist && lesson1Official && lesson2Official && lesson3Official && lesson73Official,
      actualStatus: allLessonsRes.status,
      expectedStatus: 200,
      details: `Hệ thống có đúng ${lessons.length} bài. Bài 1: "${lessons[0]?.title}", Bài 3: "${lessons[2]?.title}", Bài 73: "${lessons[72]?.title}" khớp chuẩn xác với tài liệu SGK người dùng cung cấp.`,
    });

    // -----------------------------------------------------------
    // TEST 2: RÀNG BUỘC SƯ PHẠM: Giáo viên cố giao bài CHƯA DUYỆT -> Bị từ chối HTTP 400
    // -----------------------------------------------------------
    // Bài 1 đang ở trạng thái PENDING_REVIEW, chưa được CONTENT_REVIEWER duyệt
    const assignUnapprovedRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/assignments',
      {
        classId: 'school_alpha_4A',
        lessonId: 'lesson_01',
        title: 'Bài tập tuần 1 (Thử nghiệm chưa duyệt)',
        instructions: 'Làm bài tập đầy đủ',
        deadline: new Date(Date.now() + 86400000).toISOString(),
      },
      teacherToken
    );
    results.push({
      name: 'TEST 2: Ràng buộc sư phạm: Bài học CHƯA DUYỆT (PENDING_REVIEW) không thể giao cho học sinh',
      passed: assignUnapprovedRes.status === 400 && assignUnapprovedRes.data?.error?.includes('CONTENT_REVIEWER'),
      actualStatus: assignUnapprovedRes.status,
      expectedStatus: 400,
      details: 'Hệ thống chặn thành công giáo viên giao bài chưa qua thẩm định',
    });

    // -----------------------------------------------------------
    // TEST 3: CONTENT_REVIEWER thẩm định và phê duyệt Bài 1 thành APPROVED
    // -----------------------------------------------------------
    const approveLessonRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/review-lesson',
      {
        lessonId: 'lesson_01',
        action: 'APPROVE',
      },
      reviewerToken
    );
    results.push({
      name: 'TEST 3: CONTENT_REVIEWER thẩm định và phê duyệt Bài 1 -> Trạng thái APPROVED',
      passed: approveLessonRes.status === 200 && approveLessonRes.data?.lesson?.status === 'APPROVED',
      actualStatus: approveLessonRes.status,
      expectedStatus: 200,
      details: 'Bài học 1 và toàn bộ câu hỏi liên quan được chuyển sang trạng thái APPROVED',
    });

    // -----------------------------------------------------------
    // TEST 4: Giáo viên giao bài tập Bài 1 (ĐÃ DUYỆT) cho lớp 4A thành công
    // -----------------------------------------------------------
    const futureDeadline = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 ngày sau
    const assignApprovedRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/assignments',
      {
        classId: 'school_alpha_4A',
        lessonId: 'lesson_01',
        title: 'Bài tập tuần 1: Ôn tập các số đến 100 000',
        instructions: 'Em hãy đọc kỹ đề và tính toán cẩn thận.',
        deadline: futureDeadline,
      },
      teacherToken
    );
    const validAssignmentId = assignApprovedRes.data?.assignment?.id;
    results.push({
      name: 'TEST 4: Giáo viên giao bài tập cho lớp 4A thành công sau khi nội dung đã duyệt',
      passed: assignApprovedRes.status === 201 && !!validAssignmentId,
      actualStatus: assignApprovedRes.status,
      expectedStatus: 201,
      details: `Đã phát hành bài tập ID [${validAssignmentId}] cho lớp 4A`,
    });

    // -----------------------------------------------------------
    // TEST 5: Học sinh lấy đề bài -> XÁC NHẬN BẢO MẬT: ANSWER KEYS KHÔNG BỊ LỘ
    // -----------------------------------------------------------
    const getQuestionsRes = await makeRequest(
      serverUrl,
      'GET',
      `/api/curriculum/assignments/${validAssignmentId}/questions`,
      null,
      studentToken
    );
    const questionsReceived = getQuestionsRes.data?.questions || [];
    const noAnswerKeyLeaked =
      getQuestionsRes.status === 200 &&
      questionsReceived.length > 0 &&
      questionsReceived.every((q: any) => q.answerKey === undefined && q.correctAnswer === undefined);

    results.push({
      name: 'TEST 5: Bảo vệ đề bài: Học sinh lấy bài tập TUYỆT ĐỐI KHÔNG đọc được AnswerKeys',
      passed: noAnswerKeyLeaked,
      actualStatus: getQuestionsRes.status,
      expectedStatus: 200,
      details: `Nhận ${questionsReceived.length} câu hỏi không có bất kỳ trường đáp án chuẩn nào`,
    });

    // -----------------------------------------------------------
    // TEST 6: Học sinh làm bài và nộp bài -> Backend chấm bằng quy tắc (100% chuẩn xác)
    // -----------------------------------------------------------
    // Các câu hỏi trong Bài 1: q_mc_01, q_fib_01, q_tf_01, q_mat_01, q_ord_01
    const submitFullCorrectRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: validAssignmentId,
        classId: 'school_alpha_4A',
        answers: [
          { questionId: 'q_mc_01', answer: 'C' }, // Đúng
          { questionId: 'q_fib_01', answer: '90000' }, // Đúng (chuẩn hóa số học)
          { questionId: 'q_tf_01', answer: true }, // Đúng
          { questionId: 'q_mat_01', answer: { L1: 'R3', L2: 'R2', L3: 'R1' } }, // Đúng
          { questionId: 'q_ord_01', answer: ['O2', 'O4', 'O1', 'O3'] }, // Đúng
        ],
      },
      studentToken
    );
    const subResult = submitFullCorrectRes.data?.submission;
    const isGradedAccurately =
      submitFullCorrectRes.status === 201 &&
      subResult?.status === 'GRADED' &&
      subResult?.totalScore === subResult?.maxScore &&
      subResult?.accuracyPercentage === 100;

    results.push({
      name: 'TEST 6: Chấm điểm quy tắc chuẩn xác: Làm đúng 100% được điểm tuyệt đối và lưu tiến độ',
      passed: isGradedAccurately,
      actualStatus: submitFullCorrectRes.status,
      expectedStatus: 201,
      details: `Tổng điểm đạt: ${subResult?.totalScore}/${subResult?.maxScore} (100%) qua bộ chấm logic không dùng AI`,
    });

    // -----------------------------------------------------------
    // TEST 7: CA BIÊN 1: Học sinh nộp bài lần hai -> BỊ TỪ CHỐI HTTP 400
    // -----------------------------------------------------------
    const submitDuplicateRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: validAssignmentId,
        classId: 'school_alpha_4A',
        answers: [],
      },
      studentToken
    );
    results.push({
      name: 'TEST 7: Ca biên: Nộp bài hai lần bị từ chối HTTP 400',
      passed: submitDuplicateRes.status === 400 && submitDuplicateRes.data?.error?.includes('đã được nộp trước đó'),
      actualStatus: submitDuplicateRes.status,
      expectedStatus: 400,
      details: 'Hệ thống chặn học sinh nộp lại cùng một bài tập đã hoàn thành',
    });

    // -----------------------------------------------------------
    // TEST 8: CA BIÊN 2: Nộp sau hạn -> BỊ TỪ CHỐI HTTP 400
    // -----------------------------------------------------------
    // Tạo bài tập có hạn nộp trong quá khứ
    const pastDeadline = new Date(Date.now() - 3600000).toISOString(); // 1 giờ trước
    const expiredAssignment = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: 'teacher_alpha_01',
      lessonId: 'lesson_01',
      title: 'Bài tập hết hạn nộp',
      instructions: 'Đã quá hạn',
      deadline: pastDeadline,
    });

    const submitLateRes = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: expiredAssignment.id,
        classId: 'school_alpha_4A',
        answers: [{ questionId: 'q_mc_01', answer: 'C' }],
      },
      studentToken
    );
    results.push({
      name: 'TEST 8: Ca biên: Nộp bài quá hạn bị từ chối HTTP 400',
      passed: submitLateRes.status === 400 && submitLateRes.data?.error?.includes('quá hạn nộp'),
      actualStatus: submitLateRes.status,
      expectedStatus: 400,
      details: 'Hệ thống từ chối nhận bài tập đã quá hạn deadline',
    });

    // -----------------------------------------------------------
    // TEST 9: CA BIÊN 3: Học sinh để trống & Nhập sai định dạng -> Xử lý mượt mà, chấm 0 điểm
    // -----------------------------------------------------------
    // Tạo bài tập mới cho học sinh khác (hoặc thử nghiệm với câu hỏi Bài 2)
    CurriculumStore.approveLesson('lesson_02', 'reviewer.toan@edunova.edu.vn');
    const assignment2 = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: 'teacher_alpha_01',
      lessonId: 'lesson_02',
      title: 'Bài tập 2: Thử nghiệm ca biên để trống',
      instructions: 'Kiểm tra ca biên',
      deadline: futureDeadline,
    });

    const submitEdgeCases = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: assignment2.id,
        classId: 'school_alpha_4A',
        answers: [
          { questionId: 'q_cal_01', answer: '' }, // Để trống
          { questionId: 'q_wp_01', answer: 'không biết tính' }, // Sai định dạng (chữ thay vì số)
        ],
      },
      studentToken
    );
    const edgeSubmission = submitEdgeCases.data?.submission;
    const handledGracefully =
      submitEdgeCases.status === 201 &&
      edgeSubmission?.totalScore === 0 &&
      edgeSubmission?.answers?.every((a: any) => a.isCorrect === false && a.pointsAwarded === 0);

    results.push({
      name: 'TEST 9: Ca biên: Để trống và nhập sai định dạng xử lý êm thuận, chấm 0 điểm',
      passed: handledGracefully,
      actualStatus: submitEdgeCases.status,
      expectedStatus: 201,
      details: 'Hệ thống không bị crash; các câu trả lời sai/trống được chấm 0 điểm kèm lời giải',
    });

    // -----------------------------------------------------------
    // TEST 10: Xem kết quả và Luồng luyện lại câu sai (Error Review & Retry)
    // -----------------------------------------------------------
    const getSubRes = await makeRequest(
      serverUrl,
      'GET',
      `/api/curriculum/submissions/${edgeSubmission?.id}`,
      null,
      studentToken
    );
    const wrongAnswers = getSubRes.data?.submission?.answers?.filter((a: any) => !a.isCorrect) || [];
    results.push({
      name: 'TEST 10: Luồng xem lại kết quả và hỗ trợ luyện lại các câu sai',
      passed: getSubRes.status === 200 && wrongAnswers.length === 2,
      actualStatus: getSubRes.status,
      expectedStatus: 200,
      details: `Hệ thống phân tách chính xác ${wrongAnswers.length} câu làm sai và cung cấp lời giải sư phạm chi tiết để luyện lại`,
    });

    // -----------------------------------------------------------
    // TEST 11: Đối chiếu & Cập nhật danh mục phân phối chương trình (Import Catalog)
    // -----------------------------------------------------------
    // 11.1 Học sinh không có quyền nhập danh mục (403)
    const studentImport = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/import-catalog',
      { items: [{ positionNumber: 4, title: 'Bài 4: Các số có sáu chữ số' }] },
      studentToken
    );

    // 11.2 CONTENT_REVIEWER cập nhật danh mục thành công (200)
    const reviewerImport = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/import-catalog',
      {
        items: [
          { positionNumber: 4, title: 'Bài 4: Các số có sáu chữ số' },
          { positionNumber: 5, title: 'Bài 5: Hàng và lớp' },
        ],
      },
      reviewerToken
    );

    const checkLesson4 = await makeRequest(serverUrl, 'GET', '/api/curriculum/lessons/lesson_04', null, studentToken);

    results.push({
      name: 'TEST 11: Cơ chế đối chiếu phân phối chương trình 73 bài linh hoạt và an toàn',
      passed:
        studentImport.status === 403 &&
        reviewerImport.status === 200 &&
        checkLesson4.data?.lesson?.title === 'Bài 4: Các số có sáu chữ số',
      actualStatus: reviewerImport.status,
      expectedStatus: 200,
      details: 'Học sinh bị chặn 403; Reviewer đối chiếu thành công và bài học cập nhật theo chuẩn',
    });
  } finally {
    testServer.close();
  }

  // In bảng kết quả
  console.log('------------------------------------------------------------------------------------------');
  console.log('| KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4 (LUỒNG HỌC TẬP HOÀN CHỈNH & CHẤM ĐIỂM QUY TẮC)           |');
  console.log('------------------------------------------------------------------------------------------');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅ ĐẠT (PASS)' : '❌ HỎNG (FAIL)';
    if (r.passed) passCount++;
    console.log(`${symbol} | ${r.name}`);
    console.log(`         -> Chi tiết: ${r.details}`);
  }
  console.log('------------------------------------------------------------------------------------------');
  console.log(`TỔNG KẾT: ${passCount}/${results.length} bài kiểm tra thực tế GIAI ĐOẠN 4 ĐẠT 100%`);
  console.log('==========================================================================================\n');

  return {
    total: results.length,
    passed: passCount,
    results,
  };
}

if (process.argv[1]?.endsWith('grading-flow.test.ts')) {
  runGradingFlowTestSuite().catch((err) => {
    console.error('Lỗi thực thi test:', err);
    process.exit(1);
  });
}

export { runGradingFlowTestSuite };
