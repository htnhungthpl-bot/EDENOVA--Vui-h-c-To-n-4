/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import {
  School,
  SchoolClass,
  ClassMembership,
  UserProfile,
  Question,
  AnswerKey,
  PaginatedResult,
} from '../../src/types/database.ts';

export class DataStore {
  public static schools = new Map<string, School>();
  public static classes = new Map<string, SchoolClass>();
  public static memberships = new Map<string, ClassMembership>();
  public static profiles = new Map<string, UserProfile>();
  public static questions = new Map<string, Question>();
  public static answerKeys = new Map<string, AnswerKey>();

  public static paginate<T>(items: T[], page: number, limit: number): PaginatedResult<T> {
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * limit;
    const pageItems = items.slice(startIndex, startIndex + limit);

    return {
      items: pageItems,
      total,
      page: safePage,
      limit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    };
  }

  // -------------------------------------------------------------
  // SCHOOLS API
  // -------------------------------------------------------------
  public static createSchool(data: {
    code: string;
    name: string;
    address: string;
    contactEmail: string;
    contactPhone?: string;
  }): School {
    // Kiểm tra trùng mã trường
    for (const s of this.schools.values()) {
      if (s.code.toLowerCase() === data.code.toLowerCase()) {
        throw new Error(`Mã trường [${data.code}] đã tồn tại.`);
      }
    }

    const now = new Date().toISOString();
    const school: School = {
      id: 'sch_' + crypto.randomUUID().slice(0, 8),
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      address: data.address.trim(),
      status: 'ACTIVE',
      contactEmail: data.contactEmail.trim().toLowerCase(),
      contactPhone: data.contactPhone?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.schools.set(school.id, school);
    return school;
  }

  public static updateSchoolStatus(
    schoolId: string,
    status: 'ACTIVE' | 'LOCKED',
    reason?: string
  ): School {
    const school = this.schools.get(schoolId);
    if (!school) {
      throw new Error(`Không tìm thấy trường học có ID [${schoolId}].`);
    }

    school.status = status;
    school.lockedReason = status === 'LOCKED' ? reason || 'Bị tạm dừng bởi SUPER_ADMIN' : undefined;
    school.updatedAt = new Date().toISOString();
    return school;
  }

  public static getSchools(filter?: { status?: 'ACTIVE' | 'LOCKED' }): School[] {
    let list = Array.from(this.schools.values());
    if (filter?.status) {
      list = list.filter((s) => s.status === filter.status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public static getSchoolById(schoolId: string): School | null {
    return this.schools.get(schoolId) || null;
  }

  // -------------------------------------------------------------
  // CLASSES API (Tenant-isolated by schoolId)
  // -------------------------------------------------------------
  public static createClass(
    schoolId: string,
    data: {
      code: string;
      name: string;
      gradeLevel: number;
      academicYear: string;
    }
  ): SchoolClass {
    const school = this.getSchoolById(schoolId);
    if (!school) {
      throw new Error(`Trường học [${schoolId}] không tồn tại.`);
    }
    if (school.status === 'LOCKED') {
      throw new Error(`Trường học [${school.name}] hiện đang bị KHÓA. Không thể tạo thêm lớp học.`);
    }

    // Kiểm tra trùng mã lớp trong cùng một trường
    for (const c of this.classes.values()) {
      if (c.schoolId === schoolId && c.code.toLowerCase() === data.code.toLowerCase()) {
        throw new Error(`Mã lớp [${data.code}] đã tồn tại trong trường này.`);
      }
    }

    const now = new Date().toISOString();
    const newClass: SchoolClass = {
      id: `cls_${schoolId}_${data.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      schoolId,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      gradeLevel: data.gradeLevel,
      academicYear: data.academicYear.trim(),
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.classes.set(newClass.id, newClass);
    return newClass;
  }

  public static getClassesBySchool(schoolId: string): SchoolClass[] {
    return Array.from(this.classes.values())
      .filter((c) => c.schoolId === schoolId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  public static getClassById(classId: string): SchoolClass | null {
    return this.classes.get(classId) || null;
  }

  // -------------------------------------------------------------
  // CLASS MEMBERSHIPS (Teachers & Students)
  // -------------------------------------------------------------
  public static assignTeacherToClass(
    schoolId: string,
    classId: string,
    teacherId: string
  ): ClassMembership {
    const cls = this.getClassById(classId);
    if (!cls || cls.schoolId !== schoolId) {
      throw new Error(`Lớp học [${classId}] không thuộc trường [${schoolId}].`);
    }

    // Kiểm tra xem đã phân công chưa
    for (const m of this.memberships.values()) {
      if (m.classId === classId && m.userId === teacherId && m.role === 'TEACHER') {
        return m;
      }
    }

    const now = new Date().toISOString();
    const membership: ClassMembership = {
      id: `mem_${classId}_${teacherId}`,
      schoolId,
      classId,
      userId: teacherId,
      role: 'TEACHER',
      joinedAt: now,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.memberships.set(membership.id, membership);
    return membership;
  }

  public static addStudentToClass(
    schoolId: string,
    classId: string,
    studentData: {
      studentCode: string; // Mã học sinh ẩn danh (Nguyên tắc 9)
      displayName: string;
      userId?: string;
    }
  ): { student: UserProfile; membership: ClassMembership } {
    const cls = this.getClassById(classId);
    if (!cls || cls.schoolId !== schoolId) {
      throw new Error(`Lớp học [${classId}] không thuộc trường [${schoolId}].`);
    }

    const now = new Date().toISOString();
    const userId = studentData.userId || `stu_${crypto.randomUUID().slice(0, 8)}`;

    const profile: UserProfile = {
      id: `prof_${userId}`,
      userId,
      schoolId,
      displayName: studentData.displayName.trim(),
      studentCode: studentData.studentCode.trim().toUpperCase(),
      gradeLevel: cls.gradeLevel,
      createdAt: now,
      updatedAt: now,
      isSampleData: true,
    };
    this.profiles.set(profile.userId, profile);

    const membership: ClassMembership = {
      id: `mem_${classId}_${userId}`,
      schoolId,
      classId,
      userId,
      role: 'STUDENT',
      joinedAt: now,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.memberships.set(membership.id, membership);

    return { student: profile, membership };
  }

  public static getClassMembers(classId: string, role?: 'TEACHER' | 'STUDENT'): ClassMembership[] {
    let list = Array.from(this.memberships.values()).filter((m) => m.classId === classId);
    if (role) {
      list = list.filter((m) => m.role === role);
    }
    return list;
  }

  // -------------------------------------------------------------
  // QUESTIONS & ANSWER KEYS (Strict Separation)
  // -------------------------------------------------------------
  public static getQuestions(withAnswerKeys: boolean = false): Array<Question & { answerKey?: AnswerKey }> {
    const list = Array.from(this.questions.values());

    return list.map((q) => {
      if (withAnswerKeys) {
        const key = this.answerKeys.get(q.id);
        return { ...q, answerKey: key };
      }
      // Khi không có quyền (ví dụ Học sinh): AnswerKey hoàn toàn bị loại bỏ
      return { ...q };
    });
  }

  // -------------------------------------------------------------
  // SEED SAMPLE DATA (Gắn nhãn rõ ràng "DỮ LIỆU MẪU – KHÔNG PHẢI HỌC SINH THẬT")
  // -------------------------------------------------------------
  public static seedInitialData(): void {
    if (this.schools.size > 0) return;

    const now = new Date().toISOString();

    // 1. Trường Alpha
    const alpha: School = {
      id: 'school_alpha',
      code: 'TH-ALPHA',
      name: 'Trường Tiểu học Thực nghiệm Alpha [DỮ LIỆU MẪU – KHÔNG PHẢI TRƯỜNG THẬT]',
      address: 'Số 10 Phố Giáo Dục, Ba Đình, Hà Nội',
      status: 'ACTIVE',
      contactEmail: 'bgh@thalpha.edu.vn',
      createdAt: now,
      updatedAt: now,
    };
    this.schools.set(alpha.id, alpha);

    // 2. Trường Beta
    const beta: School = {
      id: 'school_beta',
      code: 'TH-BETA',
      name: 'Trường Tiểu học Thử nghiệm Beta [DỮ LIỆU MẪU – KHÔNG PHẢI TRƯỜNG THẬT]',
      address: 'Số 25 Đường Tri Thức, Quận 1, TP. HCM',
      status: 'ACTIVE',
      contactEmail: 'bgh@thbeta.edu.vn',
      createdAt: now,
      updatedAt: now,
    };
    this.schools.set(beta.id, beta);

    // 3. Lớp học tại Trường Alpha
    const class4A = this.createClass('school_alpha', {
      code: '4A',
      name: 'Lớp 4A (Toán 4) [DỮ LIỆU MẪU – KHÔNG PHẢI LỚP THẬT]',
      gradeLevel: 4,
      academicYear: '2026-2027',
    });

    const class4B = this.createClass('school_alpha', {
      code: '4B',
      name: 'Lớp 4B (Toán 4) [DỮ LIỆU MẪU – KHÔNG PHẢI LỚP THẬT]',
      gradeLevel: 4,
      academicYear: '2026-2027',
    });

    // 4. Lớp học tại Trường Beta
    this.createClass('school_beta', {
      code: '4-BETA-1',
      name: 'Lớp 4 Beta 1 [DỮ LIỆU MẪU – KHÔNG PHẢI LỚP THẬT]',
      gradeLevel: 4,
      academicYear: '2026-2027',
    });

    // 5. Phân công Giáo viên Mai vào Lớp 4A
    this.assignTeacherToClass('school_alpha', class4A.id, 'teacher_alpha_01');

    // 6. Thêm học sinh mẫu vào Lớp 4A (Thu thập tối thiểu mã ẩn danh)
    this.addStudentToClass('school_alpha', class4A.id, {
      studentCode: 'HS-4A-01',
      displayName: 'Em Nam [DỮ LIỆU MẪU – KHÔNG PHẢI HỌC SINH THẬT]',
      userId: 'student_alpha_01',
    });

    this.addStudentToClass('school_alpha', class4A.id, {
      studentCode: 'HS-4A-02',
      displayName: 'Em Bình [DỮ LIỆU MẪU – KHÔNG PHẢI HỌC SINH THẬT]',
    });

    // 7. Tạo ngân hàng câu hỏi mẫu Toán 4 + Bảng đáp án tách rời
    const q1: Question = {
      id: 'quest_t4_001',
      lessonId: 'TOAN4-C1',
      questionType: 'MULTIPLE_CHOICE',
      content: 'Trong số 3 582 910, chữ số 5 thuộc hàng nào và lớp nào?',
      options: [
        'A. Hàng trăm nghìn, lớp nghìn',
        'B. Hàng chục nghìn, lớp nghìn',
        'C. Hàng triệu, lớp triệu',
        'D. Hàng trăm, lớp đơn vị',
      ],
      points: 2,
      difficulty: 'EASY',
      createdAt: now,
      updatedAt: now,
    };
    this.questions.set(q1.id, q1);

    const a1: AnswerKey = {
      id: 'ans_t4_001',
      questionId: q1.id,
      correctAnswer: 'A',
      explanation: 'Số 3 582 910: chữ số 0 thuộc hàng đơn vị, 1 hàng chục, 9 hàng trăm (lớp đơn vị); chữ số 2 hàng nghìn, 8 hàng chục nghìn, 5 hàng trăm nghìn (lớp nghìn).',
      createdAt: now,
      updatedAt: now,
    };
    this.answerKeys.set(q1.id, a1);

    const q2: Question = {
      id: 'quest_t4_002',
      lessonId: 'TOAN4-C1',
      questionType: 'FILL_IN_NUMBER',
      content: 'Rút gọn phân số 18/24 về phân số tối giản. Kết quả là tử số bao nhiêu nếu mẫu số là 4?',
      points: 2,
      difficulty: 'MEDIUM',
      createdAt: now,
      updatedAt: now,
    };
    this.questions.set(q2.id, q2);

    const a2: AnswerKey = {
      id: 'ans_t4_002',
      questionId: q2.id,
      correctAnswer: 3,
      explanation: 'Ta chia cả tử số và mẫu số cho 6: 18 : 6 = 3, 24 : 6 = 4. Vậy phân số tối giản là 3/4. Tử số là 3.',
      createdAt: now,
      updatedAt: now,
    };
    this.answerKeys.set(q2.id, a2);

    console.log('[DataStore] Đã khởi tạo dữ liệu mẫu 2 trường học, các lớp và ngân hàng câu hỏi chuẩn.');
  }

  public static clearForTesting(): void {
    this.schools.clear();
    this.classes.clear();
    this.memberships.clear();
    this.profiles.clear();
    this.questions.clear();
    this.answerKeys.clear();
  }
}

DataStore.seedInitialData();
