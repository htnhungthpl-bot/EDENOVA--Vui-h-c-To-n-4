/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class SchemaValidator {
  public static validateCreateSchool(data: any): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    if (!data.code || typeof data.code !== 'string' || data.code.trim().length < 2) {
      errors.push({ field: 'code', message: 'Mã trường học là bắt buộc và phải có ít nhất 2 ký tự.' });
    }
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Tên trường học là bắt buộc và phải có ít nhất 3 ký tự.' });
    }
    if (!data.contactEmail || typeof data.contactEmail !== 'string' || !data.contactEmail.includes('@')) {
      errors.push({ field: 'contactEmail', message: 'Email liên hệ của trường phải đúng định dạng.' });
    }
    return errors;
  }

  public static validateCreateSchoolAdmin(data: any): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
      errors.push({ field: 'email', message: 'Email tài khoản quản trị trường phải đúng định dạng.' });
    }
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Họ tên quản trị viên là bắt buộc.' });
    }
    if (!data.schoolId || typeof data.schoolId !== 'string') {
      errors.push({ field: 'schoolId', message: 'ID trường học liên kết là bắt buộc.' });
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 10) {
      errors.push({ field: 'password', message: 'Mật khẩu phải có độ dài tối thiểu 10 ký tự.' });
    } else {
      const hasUpper = /[A-Z]/.test(data.password);
      const hasLower = /[a-z]/.test(data.password);
      const hasNumber = /[0-9]/.test(data.password);
      const hasSpecial = /[^A-Za-z0-9]/.test(data.password);
      if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
        errors.push({
          field: 'password',
          message: 'Mật khẩu phải chứa đồng thời chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
        });
      }
    }
    return errors;
  }

  public static validateCreateClass(data: any): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Mã lớp (VD: 4A, 4B) là bắt buộc.' });
    }
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Tên lớp học là bắt buộc.' });
    }
    if (typeof data.gradeLevel !== 'number' || data.gradeLevel < 1 || data.gradeLevel > 12) {
      errors.push({ field: 'gradeLevel', message: 'Khối lớp phải là số nguyên từ 1 đến 12.' });
    }
    if (!data.academicYear || typeof data.academicYear !== 'string') {
      errors.push({ field: 'academicYear', message: 'Năm học (VD: 2026-2027) là bắt buộc.' });
    }
    return errors;
  }

  public static validateAssignTeacher(data: any): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    if (!data.teacherId || typeof data.teacherId !== 'string') {
      errors.push({ field: 'teacherId', message: 'ID giáo viên phân công là bắt buộc.' });
    }
    return errors;
  }

  public static validateAddStudent(data: any): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    if (!data.studentCode || typeof data.studentCode !== 'string' || data.studentCode.trim().length === 0) {
      errors.push({
        field: 'studentCode',
        message: 'Mã học sinh ẩn danh (studentCode) là bắt buộc theo nguyên tắc thu thập tối thiểu dữ liệu.',
      });
    }
    if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim().length === 0) {
      errors.push({ field: 'displayName', message: 'Tên hoặc biệt danh học tập là bắt buộc.' });
    }
    return errors;
  }

  public static parsePagination(query: any): { page: number; limit: number } {
    let page = parseInt(query.page as string, 10);
    let limit = parseInt(query.limit as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    return { page, limit };
  }
}
