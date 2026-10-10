/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppRole } from './auth.ts';

// -------------------------------------------------------------
// Base Entity Interface: Mọi bản ghi đều có id, createdAt, updatedAt
// -------------------------------------------------------------
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// 1. Schools: Danh mục các trường học
export interface School extends BaseEntity {
  code: string;
  name: string;
  address: string;
  status: 'ACTIVE' | 'LOCKED';
  lockedReason?: string;
  contactEmail: string;
  contactPhone?: string;
}

// 2. Users: Tài khoản người dùng cơ sở
export interface UserRecord extends BaseEntity {
  email: string;
  role: AppRole;
  schoolId?: string; // Khóa cô lập trường học
  isActive: boolean;
}

// 3. UserProfiles: Hồ sơ mở rộng (Thu thập tối thiểu, không lưu PII nhạy cảm của trẻ em)
export interface UserProfile extends BaseEntity {
  userId: string;
  schoolId?: string;
  displayName: string; // Tên hiển thị hoặc biệt danh học tập
  studentCode?: string; // Mã học sinh ẩn danh (dành cho STUDENT)
  gradeLevel?: number; // Khối lớp (VD: 4)
  notes?: string;
  isSampleData?: boolean; // Cờ đánh dấu dữ liệu mẫu
}

// 4. Classes: Lớp học
export interface SchoolClass extends BaseEntity {
  schoolId: string; // Thuộc trường
  gradeLevel: number; // 4
  code: string; // VD: "4A"
  name: string; // VD: "Lớp 4A"
  academicYear: string; // VD: "2026-2027"
  status: 'ACTIVE' | 'ARCHIVED';
  isSampleData?: boolean;
}

// 5. ClassMemberships: Phân công giáo viên và ghi danh học sinh vào lớp
export interface ClassMembership extends BaseEntity {
  schoolId: string;
  classId: string;
  userId: string;
  role: 'TEACHER' | 'STUDENT';
  joinedAt: string;
  status: 'ACTIVE' | 'LEFT';
}

// 6. Subjects: Môn học
export interface Subject extends BaseEntity {
  code: string; // VD: "TOAN"
  name: string; // "Toán học"
  gradeLevel: number; // 4
  description: string;
}

// 7. Curricula: Khung chương trình
export interface Curriculum extends BaseEntity {
  subjectId: string;
  frameworkName: string; // "Chương trình GDPT 2018"
  gradeLevel: number;
  totalStrands: number; // 4 mạch kiến thức
}

// 8. Lessons: Bài học / Chủ đề
export interface Lesson extends BaseEntity {
  subjectId: string;
  strandCode: string; // TOAN4-C1, TOAN4-C2, ...
  topicTitle: string;
  lessonOrder: number;
  objectives: string[];
}

// 9. LearningMaterials: Học liệu số
export interface LearningMaterial extends BaseEntity {
  lessonId: string;
  title: string;
  materialType: 'DOCUMENT' | 'SLIDE' | 'VIDEO' | 'INTERACTIVE';
  contentUrl?: string;
  summary: string;
  version: number;
}

// 10. Assignments: Bài tập được giao
export interface Assignment extends BaseEntity {
  schoolId: string;
  classId: string;
  teacherId: string; // ownerId
  lessonId?: string;
  title: string;
  instructions: string;
  deadline?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

// 11. Questions: Câu hỏi bài tập (Dành cho học sinh - KHÔNG CHỨA ĐÁP ÁN ĐÚNG)
export interface Question extends BaseEntity {
  assignmentId?: string;
  lessonId?: string;
  questionType: 'MULTIPLE_CHOICE' | 'FILL_IN_NUMBER' | 'TRUE_FALSE';
  content: string; // Đề bài
  options?: string[]; // Các phương án trắc nghiệm (nếu có)
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

// 12. AnswerKeys: BẢNG ĐÁP ÁN CHUẨN (TÁCH RIÊNG HOÀN TOÀN KHỎI DỮ LIỆU HỌC SINH ĐỌC ĐƯỢC)
export interface AnswerKey extends BaseEntity {
  questionId: string; // Liên kết 1-1 với Question
  correctAnswer: string | number; // Đáp án đúng chuẩn xác
  explanation: string; // Lời giải chi tiết
  ruleGradingFormula?: string; // Công thức đối soát logic
}

// 13. Submissions: Bài nộp của học sinh
export interface Submission extends BaseEntity {
  assignmentId: string;
  classId: string;
  studentId: string; // ownerId
  schoolId: string;
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
}

// 14. SubmissionAnswers: Chi tiết từng câu trả lời của học sinh
export interface SubmissionAnswer extends BaseEntity {
  submissionId: string;
  questionId: string;
  studentAnswer: string | number;
  isCorrect?: boolean; // Chấm bằng quy tắc xác định
  scoreAwarded?: number;
  gradedAt?: string;
}

// 15. LearningProgress: Tiến độ học tập cá nhân theo mạch kiến thức
export interface LearningProgress extends BaseEntity {
  studentId: string; // ownerId
  schoolId: string;
  strandCode: string;
  completedExercisesCount: number;
  accuracyRate: number; // 0 - 100%
  masteryLevel: 'NEEDS_PRACTICE' | 'PROFICIENT' | 'ADVANCED';
}

// 16. AIInteractions: Nhật ký tương tác sư phạm với Trợ giảng AI (Lọc sạch PII)
export interface AIInteractionRecord extends BaseEntity {
  studentId: string; // ownerId
  schoolId: string;
  questionContext: string;
  studentPrompt: string; // Đã loại bỏ thông tin cá nhân
  aiSocraticResponse: string; // Gợi mở từng bước
  tokenCount: number;
}

// 17. TeacherFeedback: Nhận xét sư phạm từ giáo viên
export interface TeacherFeedback extends BaseEntity {
  submissionId: string;
  teacherId: string; // ownerId
  studentId: string;
  content: string;
  encouragementNote?: string;
}

// 18. Achievements: Huy hiệu và danh hiệu nỗ lực học tập
export interface Achievement extends BaseEntity {
  studentId: string; // ownerId
  title: string;
  description: string;
  badgeCode: string;
  unlockedAt: string;
}

// 19. Notifications: Thông báo hệ thống
export interface SystemNotification extends BaseEntity {
  recipientId: string; // ownerId
  title: string;
  content: string;
  type: 'INFO' | 'ASSIGNMENT' | 'ALERT';
  isRead: boolean;
}

// 20. AIUsageRecords: Đo lường chi phí mô hình AI
export interface AIUsageRecord extends BaseEntity {
  schoolId?: string;
  userId: string;
  modelName: string; // "gemini-2.5-flash"
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

// 21. AppSettings: Cấu hình hệ thống
export interface AppSettings extends BaseEntity {
  key: string;
  value: Record<string, unknown>;
  description: string;
}

// -------------------------------------------------------------
// Pagination & Response Wrappers
// -------------------------------------------------------------
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
