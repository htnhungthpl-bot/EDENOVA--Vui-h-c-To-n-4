/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// -------------------------------------------------------------
// 1. MÔ HÌNH PHÂN TÍCH DỮ LIỆU HỌC TẬP THỰC TẾ (LEARNING ANALYTICS)
// -------------------------------------------------------------

export interface PerformanceSnapshot {
  date: string;
  assignmentId: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  accuracy: number; // 0 - 100
}

export interface ErrorPatternItem {
  errorTag: string; // Mã lỗi định danh (VD: PLACE_VALUE, CARRY_OVER, ORDER_OF_OPS...)
  errorLabel: string; // Tên dạng lỗi tiếng Việt thân thiện
  count: number; // Số lần mắc phải
  description: string; // Mô tả sư phạm nguyên nhân gây nhầm lẫn
  relatedQuestionIds: string[];
}

export interface StrandMasteryItem {
  strandCode: string;
  strandName: string;
  accuracy: number;
  totalAttempted: number;
  masteryLevel: 'CHUA_DAT' | 'DANG_TIEN_BO' | 'DAT' | 'XUAT_SAC';
}

export interface LearningAnalytics {
  studentId: string;
  totalSubmissions: number;
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
  overallAccuracy: number; // 0 - 100
  performanceOverTime: PerformanceSnapshot[];
  errorBreakdown: ErrorPatternItem[];
  strandMastery: StrandMasteryItem[];
  isSufficientData: boolean; // Đạt ngưỡng tin cậy để đề xuất hay chưa
  confidenceThreshold: {
    minSubmissionsRequired: number;
    currentSubmissions: number;
    minQuestionsRequired: number;
    currentQuestions: number;
  };
}

// -------------------------------------------------------------
// 2. MÔ HÌNH ĐỀ XUẤT CÁ NHÂN HÓA BẰNG QUY TẮC MINH BẠCH
// -------------------------------------------------------------

export interface RecommendedPracticeLesson {
  lessonId: string;
  title: string;
  reason: string; // Giải thích lý do minh bạch (Transparent Explanation)
  strandCode: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ReviewConceptItem {
  conceptName: string;
  lessonTitle: string;
  ruleSummary: string;
  reason: string; // Giải thích lý do vì sao cần ôn lại
}

export interface TeacherActionableInsight {
  topic: string;
  observation: string; // Quan sát thực tế từ dữ liệu
  suggestedIntervention: string; // Hành động sư phạm khuyến nghị cho thầy cô
}

export interface PersonalizedRecommendation {
  studentId: string;
  isSufficientData: boolean;
  statusMessage: string;
  growthMindsetNotice: string; // Tuyên bố tư duy phát triển - không kết luận năng lực cố định
  recommendedLessons: RecommendedPracticeLesson[];
  recommendedDifficulty: {
    level: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG';
    explanation: string;
  };
  reviewConcepts: ReviewConceptItem[];
  teacherInsights: TeacherActionableInsight[];
}

// -------------------------------------------------------------
// 3. MÔ HÌNH NHIỆM VỤ HỌC TẬP & MỞ KHÓA CHẶNG (MISSIONS & STAGES)
// -------------------------------------------------------------

export type MissionType =
  | 'WARM_UP' // Nhiệm vụ Khởi động
  | 'CHALLENGE' // Vượt thử thách
  | 'STAGE_MILESTONE' // Mở khóa chặng học tập
  | 'TOPIC_REVIEW' // Ôn tập theo chủ đề
  | 'MISTAKE_CORRECTION' // Luyện theo lỗi sai
  | 'PERSONAL_STREAK'; // Thử thách cá nhân / thói quen

export interface LearningMission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  pedagogicalObjective: string; // BẮT BUỘC: Mục tiêu giáo dục của nhiệm vụ
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  rewardStars: number;
  associatedLessonId?: string;
}

export interface StageMilestone {
  id: string; // STAGE_1, STAGE_2, STAGE_3, STAGE_4
  stageNumber: number;
  title: string;
  description: string;
  requiredLessonIds: string[];
  isUnlocked: boolean;
  isCompleted: boolean;
  unlockConditionText: string;
  pedagogicalObjective: string; // Mục tiêu giáo dục của chặng
}

// -------------------------------------------------------------
// 4. MÔ HÌNH SAO & HUY HIỆU SƯ PHẠM (ACHIEVEMENTS & BADGES)
// -------------------------------------------------------------

export type BadgeCategory = 'EFFORT' | 'MASTERY' | 'PERSISTENCE' | 'MILESTONE';

export interface GamificationBadge {
  id: string; // Unique Identifier (VD: BADGE_FIRST_STEP)
  title: string;
  description: string;
  category: BadgeCategory;
  iconName: string; // Tên icon Lucide
  pedagogicalObjective: string; // BẮT BUỘC: Mục tiêu giáo dục theo nguyên tắc 6
  isEarned: boolean;
  earnedAt?: string; // Thời gian nhận (nếu có)
}

export interface GamificationProfile {
  studentId: string;
  totalStars: number;
  earnedBadges: Array<{
    badgeId: string;
    earnedAt: string;
  }>;
  currentStreakDays: number;
  lastActiveDate: string;
  unlockedStageIds: string[];
  completedStageIds: string[];
}
