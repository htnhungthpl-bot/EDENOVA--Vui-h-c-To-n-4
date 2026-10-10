/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AiRequestType =
  | 'HINT_STEP' // Gợi ý bước tiếp theo (không làm hộ)
  | 'EXPLAIN_ERROR' // Phân tích nguyên nhân sai sót
  | 'SIMILAR_EXAMPLE' // Đưa bài tập/ví dụ tương tự
  | 'GENERAL_QUESTION' // Thắc mắc kiến thức trong bài học
  | 'TEACHER_DRAFT_QUESTION' // Giáo viên soạn nháp câu hỏi tương tự (Trạng thái: Chờ duyệt)
  | 'TEACHER_DRAFT_EXPLANATION'; // Giáo viên soạn nháp phản hồi sư phạm (Trạng thái: Chờ duyệt)

export interface AiScaffoldingOutput {
  misconceptionAnalysis?: string; // Phân tích nguyên nhân sai sót
  ruleReminder?: string; // Nhắc lại quy tắc / công thức SGK
  nextStepHint: string; // Gợi ý bước giải tiếp theo (không giải hộ toàn bài)
  similarExample?: {
    problem: string;
    hint: string;
  };
  encouragement: string; // Lời khích lệ học sinh lớp 4
  disclaimer: string; // Thông điệp bản quyền sư phạm & không làm hộ
  isDraft?: boolean; // Luôn là true đối với chế độ giáo viên
  reviewStatus?: 'PENDING_REVIEW';
}

export interface AiUserQuotaInfo {
  usedToday: number;
  dailyLimit: number;
  remaining: number;
  nearQuota: boolean; // Đạt ngưỡng >= 80% hạn mức
}

export interface AiResponsePayload {
  success: boolean;
  data?: AiScaffoldingOutput;
  quota?: AiUserQuotaInfo;
  error?: string;
  errorCode?:
    | 'AI_DISABLED'
    | 'AI_UNCONFIGURED'
    | 'RATE_LIMITED'
    | 'UNAPPROVED_CONTENT_BLOCKED'
    | 'AGE_INAPPROPRIATE'
    | 'UNKNOWN_ERROR';
}

export interface AiSystemConfig {
  isAiEnabled: boolean; // Công tắc toàn cục (Kill-switch)
  dailyStudentQuota: number; // Mặc định 20 lượt/ngày
  dailyTeacherQuota: number; // Mặc định 50 lượt/ngày
  warningThresholdPercent: number; // Mặc định 80%
  modelName: string; // 'gemini-3.8-flash'
  isConfigured: boolean; // Có biến môi trường GEMINI_API_KEY hay chưa
}

export interface AiUsageRecord {
  id: string;
  userId: string; // Mã người dùng (đã ẩn danh đối với học sinh, ví dụ student_alpha_01)
  userRole: string;
  lessonId: string;
  requestType: AiRequestType;
  timestamp: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  status: 'SUCCESS' | 'RATE_LIMITED' | 'DISABLED' | 'UNCONFIGURED' | 'ERROR' | 'REFUSED_POLICY';
  latencyMs: number;
  sanitizedContextNote?: string; // Không chứa PII
}
