/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { app } from '../../server.ts';
import { UserStore } from '../services/user-store.ts';
import { TokenService } from '../auth/token-service.ts';
import { CurriculumStore } from '../db/curriculum-store.ts';
import { GradingEngine } from '../db/grading-engine.ts';
import { PersonalizationEngine } from '../services/personalization-engine.ts';
import { OFFICIAL_GAMIFICATION_BADGES, OFFICIAL_STAGE_MILESTONES } from '../../src/data/gamification-catalog.ts';

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

async function runPersonalizationTests() {
  console.log('======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ CÁ NHÂN HÓA & GAMIFICATION (GIAI ĐOẠN 6)');
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
    const student = UserStore.findByEmail('student.nam@thalpha.edu.vn')!;
    const teacher = UserStore.findByEmail('teacher.nguyen@thalpha.edu.vn')!;
    const reviewer = UserStore.findByEmail('reviewer.toan@edunova.edu.vn')!;

    const studentToken = makeAuthToken(student);
    const teacherToken = makeAuthToken(teacher);

    // Đảm bảo Bài 1 và Bài 2 đã được duyệt
    CurriculumStore.approveLesson('lesson_01', reviewer.email);
    CurriculumStore.approveLesson('lesson_02', reviewer.email);

    // Reset dữ liệu kiểm thử
    PersonalizationEngine.resetForTesting();
    // Xóa submissions cũ của student nếu có để kiểm tra ca dữ liệu thiếu
    for (const [key, sub] of CurriculumStore.submissions.entries()) {
      if (sub.studentId === student.uid) {
        CurriculumStore.submissions.delete(key);
      }
    }

    // ------------------------------------------------------------------------
    // TEST 1: Ca dữ liệu thiếu (< Ngưỡng tối thiểu) -> Hiển thị "Chưa đủ dữ liệu để đề xuất"
    // ------------------------------------------------------------------------
    const resUnderThreshold = await makeRequest(serverUrl, 'GET', '/api/personalization/recommendations', null, studentToken);

    assert(
      resUnderThreshold.status === 200 &&
        resUnderThreshold.body.recommendations.isSufficientData === false &&
        resUnderThreshold.body.recommendations.statusMessage.includes('Chưa đủ dữ liệu') &&
        resUnderThreshold.body.recommendations.growthMindsetNotice.includes('Không có năng lực cố định'),
      'TEST 1: Ca dữ liệu thiếu (< Ngưỡng) -> Từ chối đề xuất vội vàng, gắn thông điệp Growth Mindset',
      `Trạng thái: "${resUnderThreshold.body.recommendations.statusMessage}". Không dán nhãn cố định học sinh khi chưa đủ dữ liệu tin cậy.`
    );

    // ------------------------------------------------------------------------
    // TEST 2: Tạo bài tập và nộp bài thật để sinh dữ liệu phân tích học tập
    // ------------------------------------------------------------------------
    // Bài tập 1: Bài 1 (5 câu hỏi)
    const asg1 = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: teacher.uid,
      lessonId: 'lesson_01',
      title: 'Bài tập Tuần 1: Ôn tập các số đến 100 000',
      instructions: 'Làm bài cẩn thận',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    // Học sinh làm bài 1: Cố tình làm sai câu q_mc_01 (chọn A thay vì C) để tạo dạng lỗi PLACE_VALUE
    const sub1Res = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: asg1.id,
        classId: 'school_alpha_4A',
        answers: [
          { questionId: 'q_mc_01', answer: 'A' }, // Sai (Đáp án đúng là C)
          { questionId: 'q_fib_01', answer: 90000 }, // Đúng
          { questionId: 'q_tf_01', answer: true }, // Đúng
        ],
      },
      studentToken
    );

    // Bài tập 2: Bài 2 (các phép tính)
    const asg2 = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: teacher.uid,
      lessonId: 'lesson_02',
      title: 'Bài tập Tuần 2: Phép tính trong phạm vi 100 000',
      instructions: 'Đặt tính thẳng cột',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    // Học sinh làm bài 2: Làm đúng 100%
    const sub2Res = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: asg2.id,
        classId: 'school_alpha_4A',
        answers: [
          { questionId: 'q_cal_01', answer: 37970 }, // Đúng
          { questionId: 'q_wp_01', answer: 37500 }, // Đúng
        ],
      },
      studentToken
    );

    assert(
      sub1Res.status === 201 && sub2Res.status === 201,
      'TEST 2.1: Hoàn thành 2 bài nộp thực tế qua bộ chấm điểm quy tắc',
      `Đã nộp thành công 2 bài tập: Asg 1 (${sub1Res.body.submission.accuracyPercentage}%), Asg 2 (${sub2Res.body.submission.accuracyPercentage}%).`
    );

    // ------------------------------------------------------------------------
    // TEST 3: Phân tích dữ liệu học tập thực tế (Learning Analytics Engine)
    // ------------------------------------------------------------------------
    const resAnalytics = await makeRequest(serverUrl, 'GET', '/api/personalization/analytics', null, studentToken);
    const analytics = resAnalytics.body.analytics;

    const hasPerformanceHistory = analytics.performanceOverTime.length === 2;
    const hasErrorBreakdown = analytics.errorBreakdown.some((e: any) => e.errorTag === 'PLACE_VALUE');
    const hasStrandMastery = analytics.strandMastery.length >= 4;

    assert(
      resAnalytics.status === 200 &&
        analytics.totalSubmissions === 2 &&
        analytics.isSufficientData === true &&
        hasPerformanceHistory &&
        hasErrorBreakdown &&
        hasStrandMastery,
      'TEST 3: Phân tích dữ liệu thật: Tỷ lệ đúng, dạng lỗi sai, tiến trình theo thời gian và mạch kiến thức',
      `Tổng số câu làm: ${analytics.totalQuestionsAttempted}, Tỷ lệ đúng: ${analytics.overallAccuracy}%. Nhận diện chính xác dạng lỗi: PLACE_VALUE (${analytics.errorBreakdown[0]?.errorLabel}).`
    );

    // ------------------------------------------------------------------------
    // TEST 4: Đề xuất bằng quy tắc minh bạch, giải thích được lý do sư phạm
    // ------------------------------------------------------------------------
    const resRec = await makeRequest(serverUrl, 'GET', '/api/personalization/recommendations', null, studentToken);
    const rec = resRec.body.recommendations;

    const hasTransparentReasons = rec.recommendedLessons.every((l: any) => l.reason && l.reason.includes('Minh bạch lý do'));
    const hasReviewConcepts = rec.reviewConcepts.length > 0 && rec.reviewConcepts[0].ruleSummary;
    const hasTeacherInsights = rec.teacherInsights.length > 0 && rec.teacherInsights[0].suggestedIntervention;

    assert(
      rec.isSufficientData === true &&
        hasTransparentReasons &&
        hasReviewConcepts &&
        hasTeacherInsights,
      'TEST 4: Đề xuất bằng quy tắc minh bạch: Có lý do giải thích rõ ràng, quy tắc SGK cần ôn & gợi ý cho giáo viên',
      `Mức độ đề xuất: ${rec.recommendedDifficulty.level} (${rec.recommendedDifficulty.explanation.slice(0, 60)}...). Bài đề xuất: ${rec.recommendedLessons[0]?.title} - Lý do: "${rec.recommendedLessons[0]?.reason.slice(0, 60)}..."`
    );

    // ------------------------------------------------------------------------
    // TEST 5: Cơ chế mở khóa chặng (Stage Milestone Unlocking) đúng điều kiện
    // ------------------------------------------------------------------------
    const resGamification = await makeRequest(serverUrl, 'GET', '/api/personalization/gamification', null, studentToken);
    const stages = resGamification.body.stages;
    const stage1 = stages.find((s: any) => s.id === 'STAGE_1');
    const stage2 = stages.find((s: any) => s.id === 'STAGE_2');

    assert(
      stage1?.isUnlocked === true && stage2?.isUnlocked === true,
      'TEST 5: Mở khóa chặng học tập (Stage Unlocking) chính xác theo điều kiện hoàn thành',
      `Chặng 1 mở khóa mặc định: ${stage1?.isUnlocked}. Chặng 2 tự động mở khóa sau khi hoàn thành Chặng 1 với độ chính xác >= 60%: ${stage2?.isUnlocked}.`
    );

    // ------------------------------------------------------------------------
    // TEST 6: Cơ chế chống cấp trùng huy hiệu (Badge Idempotency)
    // ------------------------------------------------------------------------
    const profileBefore = resGamification.body.profile;
    const badgesCountBefore = profileBefore.earnedBadges.length;

    // Nộp thêm một bài tập nữa
    const asg3 = CurriculumStore.createAssignment({
      schoolId: 'school_alpha',
      classId: 'school_alpha_4A',
      teacherId: teacher.uid,
      lessonId: 'lesson_02',
      title: 'Bài tập Tuần 3: Luyện tập thêm',
      instructions: 'Tiếp tục rèn luyện',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    const sub3Res = await makeRequest(
      serverUrl,
      'POST',
      '/api/curriculum/submissions',
      {
        assignmentId: asg3.id,
        classId: 'school_alpha_4A',
        answers: [{ questionId: 'q_cal_01', answer: 37970 }],
      },
      studentToken
    );

    const resGamificationAfter = await makeRequest(serverUrl, 'GET', '/api/personalization/gamification', null, studentToken);
    const profileAfter = resGamificationAfter.body.profile;

    // Đếm số lần xuất hiện của BADGE_FIRST_STEP
    const firstStepBadges = profileAfter.earnedBadges.filter((b: any) => b.badgeId === 'BADGE_FIRST_STEP');

    assert(
      sub3Res.status === 201 && firstStepBadges.length === 1,
      'TEST 6: Cơ chế chống cấp trùng huy hiệu (Badge Idempotency): Không cấp trùng',
      `Huy hiệu BADGE_FIRST_STEP xuất hiện đúng 1 lần duy nhất trong hồ sơ học sinh sau 3 lần nộp bài liên tiếp.`
    );

    // ------------------------------------------------------------------------
    // TEST 7: 100% Cơ chế Gamification đều gắn Mục tiêu Giáo dục (Pedagogical Objectives)
    // ------------------------------------------------------------------------
    const allBadgesHaveObjectives = OFFICIAL_GAMIFICATION_BADGES.every(
      (b) => typeof b.pedagogicalObjective === 'string' && b.pedagogicalObjective.trim().length > 10
    );

    const allStagesHaveObjectives = OFFICIAL_STAGE_MILESTONES.every(
      (s) => typeof s.pedagogicalObjective === 'string' && s.pedagogicalObjective.trim().length > 10
    );

    const missions = resGamificationAfter.body.missions;
    const allMissionsHaveObjectives = missions.every(
      (m: any) => typeof m.pedagogicalObjective === 'string' && m.pedagogicalObjective.trim().length > 10
    );

    assert(
      allBadgesHaveObjectives && allStagesHaveObjectives && allMissionsHaveObjectives,
      'TEST 7: Toàn bộ cơ chế Game hóa (Huy hiệu, Chặng, Nhiệm vụ) đều gắn Mục tiêu Giáo dục',
      `100% ${OFFICIAL_GAMIFICATION_BADGES.length} huy hiệu, ${OFFICIAL_STAGE_MILESTONES.length} chặng và ${missions.length} nhiệm vụ đều có mục tiêu giáo dục rõ ràng.`
    );

    // ------------------------------------------------------------------------
    // TEST 8: Không có Bảng xếp hạng công khai thông tin cá nhân (Bảo vệ tâm lý học sinh)
    // ------------------------------------------------------------------------
    const resPublicLeaderboard = await makeRequest(serverUrl, 'GET', '/api/personalization/public-leaderboard');

    assert(
      resPublicLeaderboard.status === 404,
      'TEST 8: Tuyệt đối KHÔNG có bảng xếp hạng công khai thông tin cá nhân học sinh',
      `Endpoint bảng xếp hạng công khai không tồn tại (HTTP 404), tuân thủ nguyên tắc bảo vệ tâm lý và không tạo áp lực cạnh tranh tiêu cực giữa học sinh tiểu học.`
    );

    console.log('------------------------------------------------------------------------------------------');
    console.log(`TỔNG KẾT: ${passed}/${total} bài kiểm tra thực tế GIAI ĐOẠN 6 ĐẠT ${(passed / total) * 100}%`);
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

runPersonalizationTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
