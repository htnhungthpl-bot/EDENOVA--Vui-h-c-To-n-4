/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ---------------------------------------------------------------------------
// 1. KIỂU DỮ LIỆU BÁO CÁO GIÁO VIÊN (TEACHER CLASS REPORT)
// ---------------------------------------------------------------------------

export interface StudentSupportItem {
  studentId: string;
  studentName: string;
  email: string;
  triggerCriteria: string; // Tiêu chí kích hoạt rõ ràng (VD: Tỷ lệ đúng < 60%, Mắc lỗi tính có nhớ >= 2 lần)
  recentAccuracy: number; // Tỷ lệ đúng gần nhất
  primaryErrorTag?: string; // Mã lỗi phổ biến của học sinh
  primaryErrorLabel?: string; // Tên lỗi tiếng Việt
  suggestedAction: string; // Khuyến nghị sư phạm cho thầy cô
}

export interface QuestionAccuracyItem {
  questionId: string;
  questionPrompt: string;
  questionType: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyPercentage: number;
  commonWrongAnswer?: string;
}

export interface AssignmentReportSummary {
  assignmentId: string;
  title: string;
  lessonId: string;
  lessonTitle: string;
  assignedCount: number;
  completedCount: number;
  completionRate: number; // 0 - 100%
  averageScore: number;
  maxScore: number;
  averageAccuracy: number;
  highestAccuracy: number;
  lowestAccuracy: number;
  deadline: string;
  createdAt: string;
}

export interface ClassReportData {
  classId: string;
  className: string;
  schoolId: string;
  totalStudents: number;
  totalAssignments: number;
  totalSubmissions: number;
  overallClassAccuracy: number;
  hasData: boolean;
  statusMessage?: string; // "Chưa có dữ liệu bài làm" nếu chưa có
  assignmentSummaries: AssignmentReportSummary[];
  questionAccuracyBreakdown: QuestionAccuracyItem[];
  commonErrorPatterns: {
    errorTag: string;
    errorLabel: string;
    count: number;
    percentage: number;
    description: string;
  }[];
  progressHistory: {
    assignmentId: string;
    title: string;
    averageAccuracy: number;
    completionRate: number;
    date: string;
  }[];
  studentsNeedingSupport: StudentSupportItem[];
  supportCriteriaExplanation: string; // Nêu rõ tiêu chí xác định học sinh cần hỗ trợ
}

// ---------------------------------------------------------------------------
// 2. KIỂU DỮ LIỆU BÁO CÁO TRƯỜNG (SCHOOL ADMIN REPORT)
// ---------------------------------------------------------------------------

export interface SchoolReportData {
  schoolId: string;
  schoolName: string;
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
  totalAssignments: number;
  totalSubmissions: number;
  schoolAverageAccuracy: number;
  schoolCompletionRate: number;
  hasData: boolean;
  statusMessage?: string;
  classSummaries: {
    classId: string;
    className: string;
    studentCount: number;
    assignmentCount: number;
    submissionCount: number;
    averageAccuracy: number;
    completionRate: number;
  }[];
  schoolErrorPatterns: {
    errorTag: string;
    errorLabel: string;
    totalCount: number;
  }[];
  teacherActivity: {
    teacherId: string;
    teacherName: string;
    assignmentsCreated: number;
    classesAssigned: string[];
  }[];
}

// ---------------------------------------------------------------------------
// 3. KIỂU DỮ LIỆU BÁO CÁO QUẢN TRỊ VIÊN TỔNG (SUPER ADMIN REPORT)
// ---------------------------------------------------------------------------

export interface ActiveAccountsStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  byRole: {
    SUPER_ADMIN: number;
    SCHOOL_ADMIN: number;
    TEACHER: number;
    STUDENT: number;
    CONTENT_REVIEWER: number;
  };
}

export interface ServiceHealthItem {
  serviceName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptimePercentage: number;
  latencyMs: number;
  lastChecked: string;
  details?: string;
}

export interface AiCostConfiguration {
  modelName: string;
  inputTokenPricePerMillionUsd: number; // VD: 0.075 USD
  outputTokenPricePerMillionUsd: number; // VD: 0.30 USD
  exchangeRateUsdToVnd: number; // VD: 25400 VND
  formulaExplanation: string;
}

export interface AiUsageAndCostReport {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  pricingConfig: AiCostConfiguration;
  estimatedCostUsd: number;
  estimatedCostVnd: number;
  costFormula: string;
  recentCallsSummary: {
    date: string;
    callsCount: number;
    tokensConsumed: number;
    estimatedCostVnd: number;
  }[];
}

export interface SystemErrorReport {
  totalErrorsRecorded: number;
  errorsByCode: {
    errorCode: string;
    count: number;
    lastOccurred: string;
  }[];
  recentErrorLogs: {
    timestamp: string;
    action: string;
    actorEmail: string;
    ip: string;
    errorMessage: string;
  }[];
}

export interface SuperAdminDashboardReport {
  activeAccounts: ActiveAccountsStats;
  serviceHealth: ServiceHealthItem[];
  aiUsageAndCost: AiUsageAndCostReport;
  systemErrors: SystemErrorReport;
  totalSchoolsCount: number;
  totalCurriculumLessonsCount: number;
}
