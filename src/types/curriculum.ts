/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LessonReviewStatus =
  | 'UNVERIFIED' // Chưa đối chiếu (Dành cho các bài chưa có phân phối chính thức)
  | 'DRAFT' // Nháp
  | 'PENDING_REVIEW' // Chờ duyệt
  | 'APPROVED'; // Đã duyệt (Đủ điều kiện giao cho học sinh)

export type QuestionType =
  | 'MULTIPLE_CHOICE' // Trắc nghiệm nhiều lựa chọn
  | 'FILL_IN_BLANK' // Điền số / Điền từ
  | 'TRUE_FALSE' // Đúng / Sai
  | 'MATCHING' // Nối cột A với cột B
  | 'ORDERING' // Sắp xếp theo thứ tự
  | 'CALCULATION' // Phép tính trực tiếp
  | 'WORD_PROBLEM' // Bài toán có lời văn
  | 'APPLICATION'; // Bài toán vận dụng thực tế

export interface LessonContentSection {
  objectives: string[]; // Mục tiêu bài học
  warmUp: {
    activityTitle: string;
    description: string;
    questionPrompt?: string;
  };
  coreKnowledge: {
    summary: string;
    rules: string[];
    diagramNote?: string;
  };
  examples: Array<{
    problem: string;
    solutionSteps: string[];
    answer: string;
  }>;
  basicPractice: string[]; // Nhiệm vụ luyện tập cơ bản
  advancedPractice: string[]; // Luyện tập nâng cao
  application: {
    realLifeScenario: string;
    task: string;
  };
  resultsSummary: string; // Tóm tắt kết quả cần đạt
  nextSuggestions: string; // Gợi ý học bài tiếp theo
  aiTutorPlaceholder: {
    status: 'NOT_IMPLEMENTED';
    label: string;
    note: string;
  };
}

export interface CurriculumLessonItem {
  id: string;
  positionNumber: number; // Từ 1 đến 73
  title: string;
  strandCode: string; // TOAN4-C1, TOAN4-C2, ...
  status: LessonReviewStatus;
  statusLabel: string;
  isDetailed: boolean; // Chỉ 3 bài đầu tiên làm sâu
  topicNumber?: number; // Chủ đề (1 đến 13)
  topicTitle?: string; // Tên chủ đề SGK
  bookVolume?: 1 | 2; // Tập 1 hoặc Tập 2
  page?: number; // Trang sách giáo khoa
  sourceBook?: string; // NXB Giáo dục Việt Nam - Bộ Kết nối tri thức với cuộc sống
  content?: LessonContentSection;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface QuestionItem {
  id: string;
  lessonId: string;
  lessonPosition: number;
  questionType: QuestionType;
  prompt: string;
  options?: string[]; // Cho MULTIPLE_CHOICE
  matchingLeft?: Array<{ id: string; text: string }>; // Cho MATCHING
  matchingRight?: Array<{ id: string; text: string }>; // Cho MATCHING
  orderingItems?: Array<{ id: string; text: string }>; // Cho ORDERING
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  knowledgeSource: string; // Nguồn kiến thức chuẩn GDPT 2018
  reviewStatus: LessonReviewStatus;
}

export interface AnswerKeyItem {
  questionId: string;
  correctAnswer: any; // Giá trị đáp án chuẩn
  explanation: string; // Hướng dẫn giải chi tiết
  gradingLogic: string; // Quy tắc chấm
}

export interface HomeworkAssignment {
  id: string;
  schoolId: string;
  classId: string;
  teacherId: string;
  lessonId: string;
  title: string;
  instructions: string;
  questionIds: string[];
  deadline: string; // ISO String
  status: 'PUBLISHED' | 'CLOSED';
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  classId: string;
  studentId: string;
  startedAt: string;
  submittedAt: string;
  totalScore: number;
  maxScore: number;
  accuracyPercentage: number;
  isLate: boolean;
  status: 'GRADED';
  answers: Array<{
    questionId: string;
    studentAnswer: any;
    isCorrect: boolean;
    pointsAwarded: number;
    explanation?: string;
    correctAnswerDisplay?: string;
  }>;
}
