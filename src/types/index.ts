/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'public' | 'student' | 'teacher' | 'admin' | 'parent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  grade?: number;
  schoolName?: string;
}

export type NavigationTarget =
  | 'landing'
  | 'privacy'
  | 'guide'
  | 'math4'
  | 'curriculum-catalog'
  | 'lesson-detail'
  | 'student-dashboard'
  | 'student-practice'
  | 'student-homework'
  | 'student-ai-tutor'
  | 'teacher-dashboard'
  | 'teacher-classes'
  | 'teacher-question-bank'
  | 'admin-dashboard'
  | 'admin-schools'
  | 'parent-dashboard'
  | 'parent-reports';

export interface BreadcrumbItem {
  label: string;
  target?: NavigationTarget;
}

export interface MathTopic {
  id: string;
  title: string;
  code: string;
  description: string;
  standardReference: string;
  lessonsCount: number;
  exerciseCount: number;
  status: 'available' | 'draft' | 'under_review';
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}
