/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { QuestionItem, StudentSubmission } from '../../types/curriculum.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Send,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface StudentPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  classId?: string;
  onSubmissionSuccess: (submission: StudentSubmission) => void;
  filterQuestionIds?: string[]; // Dùng khi học sinh chọn "Luyện lại các câu sai"
}

export const StudentPracticeModal: React.FC<StudentPracticeModalProps> = ({
  isOpen,
  onClose,
  assignmentId,
  classId = 'school_alpha_4A',
  onSubmissionSuccess,
  filterQuestionIds,
}) => {
  const { session } = useAuth();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState<string>('Bài tập về nhà');
  const [instructions, setInstructions] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lưu trữ câu trả lời của học sinh: { [questionId]: answerValue }
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen || !assignmentId) return;

    const fetchAssignmentQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {};
        if (session?.token) {
          headers['Authorization'] = `Bearer ${session.token}`;
        }

        const res = await fetch(`/api/curriculum/assignments/${assignmentId}/questions`, {
          headers,
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setAssignmentTitle(data.assignment?.title || 'Bài tập');
          setInstructions(data.assignment?.instructions || '');

          let qs: QuestionItem[] = data.questions || [];
          if (filterQuestionIds && filterQuestionIds.length > 0) {
            qs = qs.filter((q) => filterQuestionIds.includes(q.id));
          }
          setQuestions(qs);

          // Khởi tạo câu trả lời mặc định
          const initialAnswers: Record<string, any> = {};
          qs.forEach((q) => {
            if (q.questionType === 'MATCHING' && q.matchingLeft && q.matchingRight) {
              const defaultPairs: Record<string, string> = {};
              q.matchingLeft.forEach((l) => {
                defaultPairs[l.id] = q.matchingRight![0]?.id || '';
              });
              initialAnswers[q.id] = defaultPairs;
            } else if (q.questionType === 'ORDERING' && q.orderingItems) {
              initialAnswers[q.id] = q.orderingItems.map((item) => item.id);
            } else {
              initialAnswers[q.id] = '';
            }
          });
          setAnswers(initialAnswers);
        } else {
          setError(data.error || 'Lỗi tải đề bài tập');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentQuestions();
  }, [isOpen, assignmentId, filterQuestionIds, session]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans,
      }));

      const res = await fetch('/api/curriculum/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          assignmentId,
          classId: session.assignedClassIds?.[0] || classId,
          answers: payloadAnswers,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSubmissionSuccess(data.submission);
        onClose();
      } else {
        setError(data.error || 'Không thể nộp bài');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignmentTitle}
      description={
        instructions ||
        'Em hãy đọc kỹ từng câu hỏi, suy nghĩ cẩn thận và điền câu trả lời.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {error && <Alert type="error" onDismiss={() => setError(null)}>{error}</Alert>}

        {/* Thông báo bảo vệ đề thi */}
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              {filterQuestionIds && filterQuestionIds.length > 0
                ? `Chế độ Sư phạm: Đang làm lại ${questions.length} câu chưa đúng để củng cố kiến thức.`
                : `Đề thi gồm ${questions.length} câu hỏi. Chúc em làm bài thật tốt!`}
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-600">
            Lớp: {session?.assignedClassIds?.[0] || classId}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Đang tải đề thi từ máy chủ...
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    Câu {idx + 1} ({q.points} điểm)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {q.questionType}
                  </span>
                </div>

                <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                  {q.prompt}
                </p>

                {/* DẠNG 1: MULTIPLE_CHOICE */}
                {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, i) => {
                      const optCode = opt.trim().charAt(0); // A, B, C, D
                      const isSelected = answers[q.id] === optCode;
                      return (
                        <label
                          key={i}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            isSelected
                              ? 'bg-sky-50 border-sky-500 font-bold text-sky-900'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={optCode}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q.id, optCode)}
                            className="text-sky-600 focus:ring-sky-500"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* DẠNG 2: FILL_IN_BLANK */}
                {q.questionType === 'FILL_IN_BLANK' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Nhập số hoặc từ cần điền..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                    />
                  </div>
                )}

                {/* DẠNG 3: TRUE_FALSE */}
                {q.questionType === 'TRUE_FALSE' && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.id, true)}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${
                        answers[q.id] === true
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ✓ Đúng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.id, false)}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${
                        answers[q.id] === false
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ✗ Sai
                    </button>
                  </div>
                )}

                {/* DẠNG 4: MATCHING */}
                {q.questionType === 'MATCHING' && q.matchingLeft && q.matchingRight && (
                  <div className="space-y-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-semibold text-[11px] text-slate-600">
                      Ghép từng mục cột A với mục tương ứng ở cột B:
                    </p>
                    {q.matchingLeft.map((leftItem) => (
                      <div
                        key={leftItem.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200"
                      >
                        <span className="font-bold text-slate-800">
                          [{leftItem.id}] {leftItem.text}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">nối với:</span>
                          <select
                            value={answers[q.id]?.[leftItem.id] || ''}
                            onChange={(e) => {
                              const updated = { ...(answers[q.id] || {}) };
                              updated[leftItem.id] = e.target.value;
                              handleAnswerChange(q.id, updated);
                            }}
                            className="px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                          >
                            {q.matchingRight!.map((rightItem) => (
                              <option key={rightItem.id} value={rightItem.id}>
                                [{rightItem.id}] {rightItem.text}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DẠNG 5: ORDERING */}
                {q.questionType === 'ORDERING' && q.orderingItems && (
                  <div className="space-y-2 pt-1 bg-purple-50/50 p-3 rounded-xl border border-purple-200">
                    <p className="font-semibold text-[11px] text-purple-900">
                      Thứ tự hiện tại (Nhấn vào nút mũi tên để di chuyển thứ tự từ bé đến lớn):
                    </p>
                    <div className="space-y-1.5">
                      {(answers[q.id] || []).map((itemId: string, oIndex: number) => {
                        const itemObj = q.orderingItems!.find((it) => it.id === itemId);
                        return (
                          <div
                            key={itemId}
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-200"
                          >
                            <span className="font-bold text-purple-950">
                              {oIndex + 1}. [{itemId}] {itemObj?.text}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={oIndex === 0}
                                onClick={() => {
                                  const currentOrder = [...answers[q.id]];
                                  const temp = currentOrder[oIndex - 1];
                                  currentOrder[oIndex - 1] = currentOrder[oIndex];
                                  currentOrder[oIndex] = temp;
                                  handleAnswerChange(q.id, currentOrder);
                                }}
                                className="px-2 py-0.5 text-[10px] rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-40"
                              >
                                ▲ Lên
                              </button>
                              <button
                                type="button"
                                disabled={oIndex === answers[q.id].length - 1}
                                onClick={() => {
                                  const currentOrder = [...answers[q.id]];
                                  const temp = currentOrder[oIndex + 1];
                                  currentOrder[oIndex + 1] = currentOrder[oIndex];
                                  currentOrder[oIndex] = temp;
                                  handleAnswerChange(q.id, currentOrder);
                                }}
                                className="px-2 py-0.5 text-[10px] rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-40"
                              >
                                ▼ Xuống
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DẠNG 6: CALCULATION */}
                {q.questionType === 'CALCULATION' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Nhập kết quả phép tính..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono font-bold"
                    />
                  </div>
                )}

                {/* DẠNG 7: WORD_PROBLEM */}
                {q.questionType === 'WORD_PROBLEM' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Nhập số đáp số của bài toán..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono font-bold"
                    />
                  </div>
                )}

                {/* DẠNG 8: APPLICATION */}
                {q.questionType === 'APPLICATION' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Nhập giá trị của biểu thức..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={submitting || loading || questions.length === 0}
            icon={<Send className="w-4 h-4" />}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
          >
            {submitting ? 'Đang nộp bài...' : 'Hoàn thành & Nộp bài'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
