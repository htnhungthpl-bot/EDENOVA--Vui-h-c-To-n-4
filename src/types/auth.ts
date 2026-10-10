/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'CONTENT_REVIEWER';

export interface AuthClaims {
  uid: string;
  email: string;
  name: string;
  role: AppRole;
  schoolId?: string;
  assignedClassIds?: string[];
}

export interface UserSession extends AuthClaims {
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  session?: UserSession;
  error?: string;
  errorCode?: 'INVALID_CREDENTIALS' | 'RATE_LIMITED' | 'UNCONFIGURED_FIREBASE' | 'USER_DISABLED' | 'UNAUTHORIZED';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: AppRole;
  action: string;
  targetType: 'USER' | 'SCHOOL' | 'CLASS' | 'CONTENT' | 'SYSTEM' | 'SECURITY';
  targetId?: string;
  schoolId?: string;
  ip: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  details?: Record<string, unknown>;
}

export interface RolePermissionConfig {
  role: AppRole;
  label: string;
  description: string;
  scope: string;
  canAccessGlobalSettings: boolean;
  canManageSchools: boolean;
  canManageSchoolTeachers: boolean;
  canManageSchoolStudents: boolean;
  canManageClasses: boolean;
  canGradeStudents: boolean;
  canReviewContent: boolean;
  canViewAuditLogs: boolean;
}
