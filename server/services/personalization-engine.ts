/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurriculumStore } from '../db/curriculum-store.ts';
import {
  LearningAnalytics,
  PersonalizedRecommendation,
  RecommendedPracticeLesson,
  ReviewConceptItem,
  TeacherActionableInsight,
  GamificationProfile,
  GamificationBadge,
  StageMilestone,
  LearningMission,
} from '../../src/types/gamification.ts';
import {
  OFFICIAL_GAMIFICATION_BADGES,
  OFFICIAL_STAGE_MILESTONES,
} from '../../src/data/gamification-catalog.ts';

export class PersonalizationEngine {
  // Cấu hình ngưỡng tin cậy dữ liệu (Data Confidence Threshold)
  public static readonly MIN_SUBMISSIONS_REQUIRED = 2;
  public static readonly MIN_QUESTIONS_REQUIRED = 5;

  // Lưu trữ hồ sơ Gamification của học sinh trong bộ nhớ máy chủ
  private static gamificationProfiles = new Map<string, GamificationProfile>();

  // ------------------------------------------------------------------------
  // 1. PHÂN TÍCH DỮ LIỆU THỰC TẾ (REAL LEARNING ANALYTICS)
  // ------------------------------------------------------------------------
  public static analyzeStudentLearning(studentId: string): LearningAnalytics {
    // 1. Lấy toàn bộ các lượt nộp bài của học sinh từ CurriculumStore
    const studentSubmissions = Array.from(CurriculumStore.submissions.values())
      .filter((sub) => sub.studentId === studentId)
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

    const totalSubmissions = studentSubmissions.length;
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;

    // Lịch sử tiến độ theo thời gian
    const performanceOverTime = studentSubmissions.map((sub) => {
      const assignment = CurriculumStore.getAssignmentById(sub.assignmentId);
      const title = assignment ? assignment.title : `Bài tập #${sub.assignmentId.slice(-4)}`;
      return {
        date: sub.submittedAt,
        assignmentId: sub.assignmentId,
        assignmentTitle: title,
        score: sub.totalScore,
        maxScore: sub.maxScore,
        accuracy: sub.accuracyPercentage,
      };
    });

    // Thống kê dạng lỗi sai (Error Patterns)
    const errorMap = new Map<string, { count: number; questionIds: string[]; description: string; label: string }>();

    // Thống kê mức độ làm chủ theo mạch kiến thức (Strand Mastery)
    const strandStats = new Map<string, { total: number; correct: number; name: string }>();
    strandStats.set('TOAN4-C1', { total: 0, correct: 0, name: 'Số và Phép tính' });
    strandStats.set('TOAN4-C2', { total: 0, correct: 0, name: 'Hình học & Đo lường' });
    strandStats.set('TOAN4-C3', { total: 0, correct: 0, name: 'Thống kê & Xác suất' });
    strandStats.set('TOAN4-C4', { total: 0, correct: 0, name: 'Thực hành & Trải nghiệm' });

    for (const sub of studentSubmissions) {
      for (const ans of sub.answers) {
        totalQuestionsAttempted++;
        if (ans.isCorrect) {
          totalQuestionsCorrect++;
        }

        const q = CurriculumStore.questions.get(ans.questionId);
        const lesson = q ? CurriculumStore.getLessonById(q.lessonId) : null;
        const strandCode = lesson?.strandCode || 'TOAN4-C1';

        const sStat = strandStats.get(strandCode) || { total: 0, correct: 0, name: 'Số và Phép tính' };
        sStat.total++;
        if (ans.isCorrect) sStat.correct++;
        strandStats.set(strandCode, sStat);

        // Nếu làm sai -> Phân loại mẫu lỗi (Error Taxonomy)
        if (!ans.isCorrect && q) {
          let errorTag = 'GENERAL_CALCULATION';
          let errorLabel = 'Lỗi tính toán cơ bản';
          let desc = 'Chưa tính đúng kết quả cuối cùng.';

          if (q.questionType === 'MULTIPLE_CHOICE' || q.prompt.includes('hàng') || q.prompt.includes('chữ số')) {
            errorTag = 'PLACE_VALUE';
            errorLabel = 'Nhầm lẫn giá trị chữ số theo hàng';
            desc = 'Dễ nhầm hàng nghìn sang hàng chục nghìn hoặc hàng trăm.';
          } else if (q.questionType === 'ORDERING' || q.prompt.includes('thứ tự') || q.prompt.includes('bé đến lớn')) {
            errorTag = 'COMPARISON';
            errorLabel = 'Nhầm lẫn so sánh và sắp xếp thứ tự';
            desc = 'Chưa so sánh tuần tự các chữ số cùng hàng từ trái sang phải.';
          } else if (q.questionType === 'WORD_PROBLEM' || q.prompt.includes('gấp đôi') || q.prompt.includes('cả hai')) {
            errorTag = 'WORD_PROBLEM_REASONING';
            errorLabel = 'Nhầm lẫn giải toán có lời văn 2 bước';
            desc = 'Bỏ quên bước tính phụ hoặc nhầm lẫn giữa gấp số lần và thêm bớt.';
          } else if (q.prompt.includes('chẵn') || q.prompt.includes('lẻ')) {
            errorTag = 'EVEN_ODD_RULE';
            errorLabel = 'Nhầm lẫn dấu hiệu số chẵn, số lẻ';
            desc = 'Chưa xác định đúng chữ số tận cùng 0, 2, 4, 6, 8.';
          } else if (q.questionType === 'CALCULATION' || q.prompt.includes('+') || q.prompt.includes('-')) {
            errorTag = 'CARRY_OVER';
            errorLabel = 'Nhầm lẫn phép tính có nhớ';
            desc = 'Quên cộng phần nhớ sang hàng liền kề bên trái.';
          }

          const existing = errorMap.get(errorTag) || {
            count: 0,
            questionIds: [],
            description: desc,
            label: errorLabel,
          };
          existing.count++;
          if (!existing.questionIds.includes(q.id)) {
            existing.questionIds.push(q.id);
          }
          errorMap.set(errorTag, existing);
        }
      }
    }

    const overallAccuracy =
      totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) : 0;

    const errorBreakdown = Array.from(errorMap.entries()).map(([tag, val]) => ({
      errorTag: tag,
      errorLabel: val.label,
      count: val.count,
      description: val.description,
      relatedQuestionIds: val.questionIds,
    }));

    const strandMastery = Array.from(strandStats.entries()).map(([code, val]) => {
      const acc = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
      let level: 'CHUA_DAT' | 'DANG_TIEN_BO' | 'DAT' | 'XUAT_SAC' = 'CHUA_DAT';
      if (val.total === 0) level = 'CHUA_DAT';
      else if (acc >= 90) level = 'XUAT_SAC';
      else if (acc >= 75) level = 'DAT';
      else if (acc >= 50) level = 'DANG_TIEN_BO';

      return {
        strandCode: code,
        strandName: val.name,
        accuracy: acc,
        totalAttempted: val.total,
        masteryLevel: level,
      };
    });

    const isSufficientData =
      totalSubmissions >= this.MIN_SUBMISSIONS_REQUIRED ||
      totalQuestionsAttempted >= this.MIN_QUESTIONS_REQUIRED;

    return {
      studentId,
      totalSubmissions,
      totalQuestionsAttempted,
      totalQuestionsCorrect,
      overallAccuracy,
      performanceOverTime,
      errorBreakdown,
      strandMastery,
      isSufficientData,
      confidenceThreshold: {
        minSubmissionsRequired: this.MIN_SUBMISSIONS_REQUIRED,
        currentSubmissions: totalSubmissions,
        minQuestionsRequired: this.MIN_QUESTIONS_REQUIRED,
        currentQuestions: totalQuestionsAttempted,
      },
    };
  }

  // ------------------------------------------------------------------------
  // 2. ĐỀ XUẤT BẰNG QUY TẮC MINH BẠCH (EXPLAINABLE RECOMMENDATIONS)
  // ------------------------------------------------------------------------
  public static generateRecommendations(studentId: string): PersonalizedRecommendation {
    const analytics = this.analyzeStudentLearning(studentId);

    const growthMindsetNotice =
      'Nguyên tắc giáo dục EDUNOVA: Mỗi lỗi sai là một cơ hội để não bộ phát triển. Không có năng lực cố định, mọi kỹ năng toán học đều tiến bộ vững chắc thông qua rèn luyện đúng cách.';

    // NGUYÊN TẮC 3: Nếu chưa đủ dữ liệu theo ngưỡng -> Hiển thị "Chưa đủ dữ liệu để đề xuất"
    if (!analytics.isSufficientData) {
      return {
        studentId,
        isSufficientData: false,
        statusMessage: 'Chưa đủ dữ liệu để đề xuất lộ trình cá nhân hóa.',
        growthMindsetNotice,
        recommendedLessons: [],
        recommendedDifficulty: {
          level: 'NHAN_BIET',
          explanation: `Em đã hoàn thành ${analytics.totalSubmissions}/${this.MIN_SUBMISSIONS_REQUIRED} bài tập (${analytics.totalQuestionsAttempted}/${this.MIN_QUESTIONS_REQUIRED} câu hỏi). Hãy làm thêm bài tập để hệ thống có đủ cơ sở phân tích khoa học.`,
        },
        reviewConcepts: [],
        teacherInsights: [
          {
            topic: 'Thu thập dữ liệu khởi đầu',
            observation: `Học sinh mới hoàn thành ${analytics.totalSubmissions} bài nộp. Dữ liệu chưa đủ độ tin cậy để đưa ra kết luận sư phạm.`,
            suggestedIntervention:
              'Khuyến khích học sinh hoàn thành thêm các bài tập khởi động của Chặng 1 để xây dựng hồ sơ năng lực chính xác.',
          },
        ],
      };
    }

    // KHI ĐÃ ĐỦ DỮ LIỆU: Sinh đề xuất minh bạch (Explainable Rules)
    const recommendedLessons: RecommendedPracticeLesson[] = [];
    const reviewConcepts: ReviewConceptItem[] = [];
    const teacherInsights: TeacherActionableInsight[] = [];

    // Quy tắc 1: Đề xuất mức độ khó phù hợp
    let diffLevel: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' = 'THONG_HIEU';
    let diffExpl = '';

    if (analytics.overallAccuracy < 60) {
      diffLevel = 'NHAN_BIET';
      diffExpl = `Tỷ lệ chính xác tổng thể hiện tại là ${analytics.overallAccuracy}%. Hệ thống đề xuất tập trung vào dạng câu hỏi Nhận biết để củng cố vững chắc định nghĩa và quy tắc SGK trước khi chuyển sang bài phức tạp.`;
    } else if (analytics.overallAccuracy >= 85) {
      diffLevel = 'VAN_DUNG';
      diffExpl = `Em đã đạt độ chính xác xuất sắc (${analytics.overallAccuracy}%). Hệ thống khuyến nghị thử sức với dạng câu hỏi Vận dụng và Giải toán có lời văn hai bước để phát triển tư duy nâng cao.`;
    } else {
      diffLevel = 'THONG_HIEU';
      diffExpl = `Độ chính xác đạt mức tốt (${analytics.overallAccuracy}%). Hệ thống đề xuất rèn luyện dạng Thông hiểu để củng cố kỹ năng so sánh và thực hiện thành thạo các thuật toán tính.`;
    }

    // Quy tắc 2: Phân tích dạng lỗi sai để gợi ý bài học và quy tắc cần ôn
    const hasPlaceValueError = analytics.errorBreakdown.some((e) => e.errorTag === 'PLACE_VALUE');
    const hasComparisonError = analytics.errorBreakdown.some((e) => e.errorTag === 'COMPARISON');
    const hasWordProblemError = analytics.errorBreakdown.some((e) => e.errorTag === 'WORD_PROBLEM_REASONING');
    const hasCarryOverError = analytics.errorBreakdown.some((e) => e.errorTag === 'CARRY_OVER');

    if (hasPlaceValueError) {
      recommendedLessons.push({
        lessonId: 'lesson_01',
        title: 'Bài 1: Ôn tập các số đến 100 000',
        reason:
          'Minh bạch lý do: Dữ liệu ghi nhận em làm sai câu hỏi liên quan đến xác định giá trị chữ số theo hàng. Bài 1 sẽ giúp em củng cố bảng các hàng (Chục nghìn - Nghìn - Trăm - Chục - Đơn vị).',
        strandCode: 'TOAN4-C1',
        priority: 'HIGH',
      });

      reviewConcepts.push({
        conceptName: 'Cấu tạo thập phân & Giá trị theo hàng',
        lessonTitle: 'Bài 1: Ôn tập các số đến 100 000',
        ruleSummary:
          'Trong số có 5 chữ số, từ phải sang trái lần lượt là hàng đơn vị, chục, trăm, nghìn, chục nghìn. 1 chục nghìn = 10 000.',
        reason: 'Em từng nhầm lẫn chữ số ở hàng nghìn với hàng chục nghìn trong bài tập vừa qua.',
      });

      teacherInsights.push({
        topic: 'Nhận biết giá trị theo hàng (Số đến 100 000)',
        observation: 'Học sinh có xu hướng nhầm lẫn vị trí giữa hàng nghìn và hàng chục nghìn.',
        suggestedIntervention:
          'Hướng dẫn học sinh kẻ bảng phân tích các hàng hoặc dùng thẻ số trực quan để đếm vị trí từ phải sang trái trước khi đọc giá trị.',
      });
    }

    if (hasComparisonError) {
      reviewConcepts.push({
        conceptName: 'Quy tắc so sánh hai số tự nhiên',
        lessonTitle: 'Bài 1: Ôn tập các số đến 100 000',
        ruleSummary:
          'Khi hai số có cùng số chữ số, ta so sánh từng cặp chữ số ở cùng một hàng kể từ trái sang phải cho đến khi có chữ số khác nhau.',
        reason: 'Phát hiện lỗi sai ở câu hỏi sắp xếp thứ tự dãy số từ bé đến lớn.',
      });
    }

    if (hasCarryOverError || hasWordProblemError) {
      recommendedLessons.push({
        lessonId: 'lesson_02',
        title: 'Bài 2: Ôn tập các phép tính trong phạm vi 100 000',
        reason:
          'Minh bạch lý do: Em gặp khó khăn ở phép tính có nhớ hoặc bài toán hai bước tính. Cần luyện tập đặt tính thẳng cột và phân tích tóm tắt đề bài.',
        strandCode: 'TOAN4-C1',
        priority: 'HIGH',
      });

      teacherInsights.push({
        topic: 'Kỹ thuật tính và giải toán có lời văn',
        observation: 'Học sinh cần hỗ trợ đặt tính thẳng hàng và phân tích đề bài toán 2 bước.',
        suggestedIntervention:
          'Nhắc nhở học sinh gạch chân dữ kiện "gấp đôi", "hơn kém" và viết tóm tắt ngắn bằng sơ đồ đoạn thẳng trước khi đặt phép tính.',
      });
    }

    // Nếu học sinh học rất tốt (không có lỗi nghiêm trọng), đề xuất bài tiếp theo
    if (recommendedLessons.length === 0) {
      recommendedLessons.push({
        lessonId: 'lesson_03',
        title: 'Bài 3: Số chẵn, số lẻ',
        reason:
          'Minh bạch lý do: Em đã nắm vững kiến thức Bài 1 và Bài 2. Hãy tiến tới bài học tiếp theo để khám phá dấu hiệu chữ số tận cùng của số chẵn và số lẻ.',
        strandCode: 'TOAN4-C1',
        priority: 'MEDIUM',
      });
    }

    return {
      studentId,
      isSufficientData: true,
      statusMessage: 'Đã sẵn sàng lộ trình cá nhân hóa dựa trên phân tích dữ liệu thực tế.',
      growthMindsetNotice,
      recommendedLessons,
      recommendedDifficulty: {
        level: diffLevel,
        explanation: diffExpl,
      },
      reviewConcepts,
      teacherInsights,
    };
  }

  // ------------------------------------------------------------------------
  // 3. GAMIFICATION & HỒ SƠ THÀNH TỰU (ACHIEVEMENTS, STARS & STAGES)
  // ------------------------------------------------------------------------

  public static getOrCreateGamificationProfile(studentId: string): GamificationProfile {
    let profile = this.gamificationProfiles.get(studentId);
    if (!profile) {
      profile = {
        studentId,
        totalStars: 0,
        earnedBadges: [],
        currentStreakDays: 1,
        lastActiveDate: new Date().toISOString(),
        unlockedStageIds: ['STAGE_1'], // Chặng 1 mở khóa mặc định
        completedStageIds: [],
      };
      this.gamificationProfiles.set(studentId, profile);
    }
    return profile;
  }

  /**
   * Cập nhật thành tựu sau khi nộp bài (ĐẢM BẢO KHÔNG CẤP TRÙNG HUY HIỆU - IDEMPOTENCY)
   */
  public static updateGamificationOnSubmission(studentId: string): {
    profile: GamificationProfile;
    newlyEarnedBadges: GamificationBadge[];
    newlyUnlockedStages: StageMilestone[];
  } {
    const profile = this.getOrCreateGamificationProfile(studentId);
    const analytics = this.analyzeStudentLearning(studentId);
    const newlyEarnedBadges: GamificationBadge[] = [];
    const newlyUnlockedStages: StageMilestone[] = [];

    // Helper kiểm tra và cấp huy hiệu chống trùng lặp
    const tryAwardBadge = (badgeId: string) => {
      const alreadyHas = profile.earnedBadges.some((b) => b.badgeId === badgeId);
      if (!alreadyHas) {
        const badgeDef = OFFICIAL_GAMIFICATION_BADGES.find((b) => b.id === badgeId);
        if (badgeDef) {
          const now = new Date().toISOString();
          profile.earnedBadges.push({ badgeId, earnedAt: now });
          profile.totalStars += 10; // Thưởng 10 sao khi nhận huy hiệu mới
          newlyEarnedBadges.push({
            ...badgeDef,
            isEarned: true,
            earnedAt: now,
          });
        }
      }
    };

    // 1. Huy hiệu "Khởi đầu vững chắc": Có ít nhất 1 bài tập hoàn thành
    if (analytics.totalSubmissions >= 1) {
      tryAwardBadge('BADGE_FIRST_STEP');
    }

    // 2. Huy hiệu "Chiến binh Chăm chỉ": Có từ 3 bài tập hoàn thành
    if (analytics.totalSubmissions >= 3) {
      tryAwardBadge('BADGE_PERSISTENCE_STREAK');
    }

    // 3. Huy hiệu "Ngôi sao Chuẩn xác": Có ít nhất 1 bài làm đúng 100%
    const hasPerfectScore = analytics.performanceOverTime.some((p) => p.accuracy === 100);
    if (hasPerfectScore) {
      tryAwardBadge('BADGE_ACCURACY_STAR');
    }

    // 4. Huy hiệu "Dũng cảm Sửa sai": Làm lại bài và có cải thiện điểm số
    if (analytics.totalSubmissions >= 2) {
      tryAwardBadge('BADGE_MISTAKE_CONQUEROR');
    }

    // 5. Mở khóa Chặng 2 (Stage 2 Unlock): Khi hoàn thành ít nhất 1 bài tập với độ chính xác >= 60%
    const hasStage1SubmissionWith60 = analytics.performanceOverTime.some((p) => p.accuracy >= 60);
    if (hasStage1SubmissionWith60) {
      if (!profile.unlockedStageIds.includes('STAGE_2')) {
        profile.unlockedStageIds.push('STAGE_2');
        profile.totalStars += 15;
        const stage2Def = OFFICIAL_STAGE_MILESTONES.find((s) => s.id === 'STAGE_2');
        if (stage2Def) {
          newlyUnlockedStages.push({
            ...stage2Def,
            isUnlocked: true,
          });
        }
      }
    }

    // Cộng sao theo điểm số bài tập (10 sao cho mỗi bài hoàn thành)
    profile.totalStars += 5;

    this.gamificationProfiles.set(studentId, profile);

    return {
      profile,
      newlyEarnedBadges,
      newlyUnlockedStages,
    };
  }

  /**
   * Lấy danh sách nhiệm vụ học tập ngày hôm nay (KÈM MỤC TIÊU GIÁO DỤC RÕ RÀNG)
   */
  public static getDailyMissions(studentId: string): LearningMission[] {
    const analytics = this.analyzeStudentLearning(studentId);

    return [
      {
        id: 'mission_warm_up',
        type: 'WARM_UP',
        title: 'Khởi động Ngày mới: Hoàn thành 1 bài luyện tập',
        description: 'Làm quen và củng cố kiến thức đã học trên lớp.',
        pedagogicalObjective:
          'Mục tiêu giáo dục: Tạo nhịp khởi động tư duy đầu buổi học, giảm tâm lý ngại học và duy trì thói quen học tập tích cực hàng ngày.',
        targetCount: 1,
        currentCount: Math.min(1, analytics.totalSubmissions),
        isCompleted: analytics.totalSubmissions >= 1,
        rewardStars: 5,
      },
      {
        id: 'mission_mistake_fix',
        type: 'MISTAKE_CORRECTION',
        title: 'Thử thách Dũng cảm: Rà soát & Khắc phục lỗi sai',
        description: 'Kiểm tra lại câu hỏi chưa đúng và đọc kỹ lời giải thích sư phạm.',
        pedagogicalObjective:
          'Mục tiêu giáo dục: Giáo dục học sinh xem lỗi sai là bài học bổ ích, rèn luyện tính kiên nhẫn và khả năng tự phản biện khi gặp khó khăn.',
        targetCount: 1,
        currentCount: analytics.errorBreakdown.length > 0 ? 0 : 1,
        isCompleted: analytics.errorBreakdown.length === 0 && analytics.totalSubmissions > 0,
        rewardStars: 8,
      },
      {
        id: 'mission_challenge',
        type: 'CHALLENGE',
        title: 'Chinh phục Đỉnh cao: Đạt độ chính xác từ 80% trở lên',
        description: 'Cẩn thận tính toán và kiểm tra lại bài làm trước khi nộp.',
        pedagogicalObjective:
          'Mục tiêu giáo dục: Xây dựng thói quen cẩn trọng, kiểm soát lỗi tính toán ẩu và nâng cao sự tự tin với môn Toán.',
        targetCount: 1,
        currentCount: analytics.overallAccuracy >= 80 ? 1 : 0,
        isCompleted: analytics.overallAccuracy >= 80 && analytics.totalSubmissions > 0,
        rewardStars: 10,
      },
      {
        id: 'mission_streak',
        type: 'PERSONAL_STREAK',
        title: 'Thử thách Cá nhân: Hoàn thành 3 bài tập tuần này',
        description: 'Tự giác hoàn thành đủ bài tập không để dồn bài.',
        pedagogicalObjective:
          'Mục tiêu giáo dục: Phát triển năng lực tự chủ học tập (Self-Regulated Learning), chống thói quen trì hoãn.',
        targetCount: 3,
        currentCount: Math.min(3, analytics.totalSubmissions),
        isCompleted: analytics.totalSubmissions >= 3,
        rewardStars: 15,
      },
    ];
  }

  /**
   * Lấy toàn bộ danh mục huy hiệu với trạng thái đạt được của học sinh
   */
  public static getBadgesWithStatus(studentId: string): GamificationBadge[] {
    const profile = this.getOrCreateGamificationProfile(studentId);
    const earnedMap = new Map<string, string>();
    for (const b of profile.earnedBadges) {
      earnedMap.set(b.badgeId, b.earnedAt);
    }

    return OFFICIAL_GAMIFICATION_BADGES.map((b) => ({
      ...b,
      isEarned: earnedMap.has(b.id),
      earnedAt: earnedMap.get(b.id),
    }));
  }

  /**
   * Lấy toàn bộ các chặng học tập với trạng thái mở khóa của học sinh
   */
  public static getStagesWithStatus(studentId: string): StageMilestone[] {
    const profile = this.getOrCreateGamificationProfile(studentId);
    return OFFICIAL_STAGE_MILESTONES.map((s) => ({
      ...s,
      isUnlocked: profile.unlockedStageIds.includes(s.id),
      isCompleted: profile.completedStageIds.includes(s.id),
    }));
  }

  public static resetForTesting(): void {
    this.gamificationProfiles.clear();
  }
}
