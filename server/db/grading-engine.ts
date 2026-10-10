/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurriculumStore } from './curriculum-store.ts';
import { DataStore } from './data-store.ts';
import { StudentSubmission, QuestionType } from '../../src/types/curriculum.ts';
import { LearningProgress } from '../../src/types/database.ts';

export interface AnswerSubmissionPayload {
  questionId: string;
  answer: any;
}

export interface SubmissionRequest {
  assignmentId: string;
  classId: string;
  studentId: string;
  answers: AnswerSubmissionPayload[];
}

export class GradingEngine {
  /**
   * Bộ chấm điểm thuần quy tắc toán học xác định (100% Deterministic, không phụ thuộc AI)
   */
  public static gradeSubmission(req: SubmissionRequest): StudentSubmission {
    const assignment = CurriculumStore.getAssignmentById(req.assignmentId);
    if (!assignment) {
      throw new Error(`Bài tập [${req.assignmentId}] không tồn tại.`);
    }

    const now = new Date();

    // 1. Kiểm tra Ca biên: Nộp sau hạn
    const deadlineDate = new Date(assignment.deadline);
    if (now.getTime() > deadlineDate.getTime()) {
      throw new Error(`Bài tập đã quá hạn nộp (${deadlineDate.toLocaleString('vi-VN')}). Hệ thống từ chối nhận bài.`);
    }

    // 2. Kiểm tra Ca biên: Nộp hai lần
    for (const sub of CurriculumStore.submissions.values()) {
      if (sub.assignmentId === req.assignmentId && sub.studentId === req.studentId) {
        throw new Error('Bài tập đã được nộp trước đó. Học sinh không được nộp lại lần hai.');
      }
    }

    let totalScore = 0;
    let maxScore = 0;

    const answerMap = new Map<string, any>();
    for (const a of req.answers || []) {
      answerMap.set(a.questionId, a.answer);
    }

    const gradedAnswers: StudentSubmission['answers'] = [];

    // Duyệt qua từng câu hỏi trong đề
    for (const qId of assignment.questionIds) {
      const question = CurriculumStore.questions.get(qId);
      const answerKey = CurriculumStore.getAnswerKey(qId);

      if (!question || !answerKey) continue;

      maxScore += question.points;
      const rawStudentAnswer = answerMap.get(qId);

      const isCorrect = this.evaluateSingleAnswer(
        question.questionType,
        rawStudentAnswer,
        answerKey.correctAnswer
      );

      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;

      gradedAnswers.push({
        questionId: qId,
        studentAnswer: rawStudentAnswer ?? null,
        isCorrect,
        pointsAwarded,
        explanation: answerKey.explanation,
        correctAnswerDisplay: this.formatAnswerDisplay(answerKey.correctAnswer),
      });
    }

    const accuracyPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const submission: StudentSubmission = {
      id: `sub_${Date.now()}_${req.studentId.slice(-4)}`,
      assignmentId: req.assignmentId,
      classId: req.classId,
      studentId: req.studentId,
      startedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      submittedAt: now.toISOString(),
      totalScore,
      maxScore,
      accuracyPercentage,
      isLate: false,
      status: 'GRADED',
      answers: gradedAnswers,
    };

    // Lưu trữ kết quả nộp bài
    CurriculumStore.submissions.set(submission.id, submission);

    // Cập nhật tiến độ học tập (LearningProgress)
    this.updateStudentProgress(req.studentId, assignment.schoolId, totalScore, maxScore);

    return submission;
  }

  /**
   * Đánh giá đơn lẻ từng dạng câu hỏi (Quy tắc toán học)
   */
  public static evaluateSingleAnswer(
    type: QuestionType,
    studentAnswer: any,
    correctAnswer: any
  ): boolean {
    // Ca biên: Học sinh để trống (null, undefined, '')
    if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
      return false;
    }

    switch (type) {
      case 'MULTIPLE_CHOICE': {
        // Trắc nghiệm: so sánh ký tự lựa chọn 'A', 'B', 'C', 'D'
        return String(studentAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
      }

      case 'FILL_IN_BLANK':
      case 'CALCULATION':
      case 'WORD_PROBLEM':
      case 'APPLICATION': {
        // Các dạng điền số / phép tính / giải toán số học
        // Ca biên: Chuẩn hóa số học (loại bỏ dấu cách hàng nghìn như "90 000" -> 90000)
        const cleanStudent = String(studentAnswer).replace(/\s+/g, '').replace(/,/g, '.');
        const cleanCorrect = String(correctAnswer).replace(/\s+/g, '').replace(/,/g, '.');

        const numStudent = parseFloat(cleanStudent);
        const numCorrect = parseFloat(cleanCorrect);

        // Nếu cả hai đều là số hợp lệ
        if (!isNaN(numStudent) && !isNaN(numCorrect)) {
          return Math.abs(numStudent - numCorrect) < 0.0001;
        }

        // Nếu là chuỗi chữ
        return cleanStudent.toLowerCase() === cleanCorrect.toLowerCase();
      }

      case 'TRUE_FALSE': {
        // Đúng/Sai: Chấp nhận boolean true/false hoặc chuỗi "đúng"/"sai"
        const stdNorm = String(studentAnswer).trim().toLowerCase();
        const crtNorm = String(correctAnswer).trim().toLowerCase();

        const isTrueVal = (val: string) => val === 'true' || val === 'đúng' || val === 'dung' || val === '1';
        const isFalseVal = (val: string) => val === 'false' || val === 'sai' || val === '0';

        if (isTrueVal(stdNorm) && isTrueVal(crtNorm)) return true;
        if (isFalseVal(stdNorm) && isFalseVal(crtNorm)) return true;
        return false;
      }

      case 'MATCHING': {
        // Dạng nối cặp: đối soát từng cặp key-value
        if (typeof studentAnswer !== 'object' || typeof correctAnswer !== 'object') {
          return false;
        }
        const studentKeys = Object.keys(studentAnswer);
        const correctKeys = Object.keys(correctAnswer);

        if (studentKeys.length !== correctKeys.length) return false;

        for (const k of correctKeys) {
          if (studentAnswer[k] !== correctAnswer[k]) {
            return false;
          }
        }
        return true;
      }

      case 'ORDERING': {
        // Dạng sắp xếp thứ tự: so sánh mảng danh sách ID
        if (!Array.isArray(studentAnswer) || !Array.isArray(correctAnswer)) {
          return false;
        }
        if (studentAnswer.length !== correctAnswer.length) return false;

        for (let i = 0; i < correctAnswer.length; i++) {
          if (studentAnswer[i] !== correctAnswer[i]) {
            return false;
          }
        }
        return true;
      }

      default:
        return false;
    }
  }

  private static formatAnswerDisplay(answer: any): string {
    if (typeof answer === 'object') {
      return JSON.stringify(answer);
    }
    return String(answer);
  }

  private static updateStudentProgress(
    studentId: string,
    schoolId: string,
    earnedScore: number,
    maxScore: number
  ): void {
    // Cập nhật bản ghi LearningProgress cho học sinh
    const progressKey = `prog_${studentId}_TOAN4`;
    const accuracy = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;

    const progressRecord: LearningProgress = {
      id: progressKey,
      studentId,
      schoolId,
      strandCode: 'TOAN4-C1',
      completedExercisesCount: 1,
      accuracyRate: accuracy,
      masteryLevel: accuracy >= 80 ? 'ADVANCED' : accuracy >= 50 ? 'PROFICIENT' : 'NEEDS_PRACTICE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Lưu vào DataStore (hoặc memory map)
    (DataStore as any).learningProgress = (DataStore as any).learningProgress || new Map();
    (DataStore as any).learningProgress.set(progressRecord.id, progressRecord);
  }
}
