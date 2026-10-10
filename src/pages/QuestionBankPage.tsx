/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { QuestionItem, AnswerKeyItem, QuestionType } from '../types/curriculum.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  HelpCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Filter,
  Search,
  BookOpen,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Check,
} from 'lucide-react';

interface QuestionWithKey extends QuestionItem {
  answerKey?: AnswerKeyItem;
}

export interface QuestionBankPageProps {
  onBack?: () => void;
}

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({ onBack }) => {
  const { session } = useAuth();
  const [questions, setQuestions] = useState<QuestionWithKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const isPrivileged = session?.role && ['TEACHER', 'CONTENT_REVIEWER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.role);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch('/api/curriculum/questions', { headers });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
      } else {
        setError(data.error || 'Lỗi tải ngân hàng câu hỏi');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [session]);

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const questionTypeLabels: Record<QuestionType, { label: string; color: string }> = {
    MULTIPLE_CHOICE: { label: '1. Trắc nghiệm (4 PA)', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    FILL_IN_BLANK: { label: '2. Điền số / từ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    TRUE_FALSE: { label: '3. Đúng / Sai', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    MATCHING: { label: '4. Nối cột A-B', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    ORDERING: { label: '5. Sắp xếp thứ tự', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    CALCULATION: { label: '6. Phép tính trực tiếp', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    WORD_PROBLEM: { label: '7. Bài toán có lời văn', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    APPLICATION: { label: '8. Vận dụng thực tế', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesType = selectedType === 'ALL' || q.questionType === selectedType;
    const matchesDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    return matchesType && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F294A] to-slate-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chuẩn hóa 8 dạng câu hỏi Toán lớp 4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ngân hàng Câu hỏi Toán 4 (GDPT 2018)
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            Hỗ trợ đầy đủ 8 dạng toán tiểu học: Trắc nghiệm, Điền số, Đúng/Sai, Nối, Sắp xếp, Phép tính, Lời văn và Vận dụng. Đáp án và giải thích được bảo mật phân quyền nghiêm ngặt.
          </p>
        </div>

        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0"
          >
            Quay lại
          </Button>
        )}
      </div>

      {/* Thông báo phân quyền bảo mật */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            {isPrivileged ? (
              <>
                Vai trò của bạn <strong>[{session?.role}]</strong>: Có thẩm quyền kiểm tra Đáp án chuẩn (AnswerKeys) và Lời giải sư phạm.
              </>
            ) : (
              <>
                Chế độ học sinh/khách: Đáp án chuẩn (AnswerKeys) được bảo vệ nghiêm ngặt ở cấp máy chủ và không được trả về qua API.
              </>
            )}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 shrink-0">
          Tổng số câu hỏi: {questions.length}
        </span>
      </div>

      {error && <Alert type="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Bộ lọc */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Dạng câu hỏi (8 dạng chuẩn)
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Chọn dạng câu hỏi"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="ALL">Tất cả 8 dạng câu hỏi</option>
              <option value="MULTIPLE_CHOICE">1. Trắc nghiệm</option>
              <option value="FILL_IN_BLANK">2. Điền số / từ</option>
              <option value="TRUE_FALSE">3. Đúng / Sai</option>
              <option value="MATCHING">4. Nối cột</option>
              <option value="ORDERING">5. Sắp xếp thứ tự</option>
              <option value="CALCULATION">6. Phép tính trực tiếp</option>
              <option value="WORD_PROBLEM">7. Bài toán có lời văn</option>
              <option value="APPLICATION">8. Vận dụng thực tế</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Mức độ khó
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              aria-label="Chọn mức độ khó"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="EASY">Dễ (Nhận biết)</option>
              <option value="MEDIUM">Trung bình (Thông hiểu)</option>
              <option value="HARD">Khó (Vận dụng nâng cao)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Danh sách câu hỏi */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Đang nạp ngân hàng câu hỏi...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Không có câu hỏi nào thỏa mãn bộ lọc.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const typeInfo = questionTypeLabels[q.questionType] || {
              label: q.questionType,
              color: 'bg-slate-50 text-slate-700 border-slate-200',
            };
            const isRevealed = !!revealedKeys[q.id];

            return (
              <Card key={q.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ID: {q.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {q.points} điểm
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">
                      Mức độ: <strong>{q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {q.reviewStatus}
                    </span>
                  </div>
                </div>

                {/* Đề bài */}
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                    {q.prompt}
                  </p>

                  {/* Hiển thị chi tiết theo dạng câu hỏi */}
                  {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType === 'MATCHING' && q.matchingLeft && q.matchingRight && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="space-y-1.5">
                        <p className="font-bold text-xs text-slate-700">Cột A:</p>
                        {q.matchingLeft.map((item) => (
                          <div key={item.id} className="p-2 bg-white rounded border border-slate-200 text-xs">
                            <span className="font-bold text-sky-600 mr-1.5">[{item.id}]</span>
                            {item.text}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-bold text-xs text-slate-700">Cột B:</p>
                        {q.matchingRight.map((item) => (
                          <div key={item.id} className="p-2 bg-white rounded border border-slate-200 text-xs">
                            <span className="font-bold text-amber-600 mr-1.5">[{item.id}]</span>
                            {item.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.questionType === 'ORDERING' && q.orderingItems && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {q.orderingItems.map((item) => (
                        <span key={item.id} className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold">
                          [{item.id}] {item.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nguồn kiến thức */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nguồn kiến thức: <strong>{q.knowledgeSource}</strong></span>
                </div>

                {/* Khu vực Đáp án chuẩn (Bảo mật) */}
                {isPrivileged && q.answerKey && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleRevealKey(q.id)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isRevealed ? 'Ẩn đáp án & giải thích' : 'Xem đáp án chuẩn & Lời giải sư phạm'}
                    </button>

                    {isRevealed && (
                      <div className="mt-2 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-emerald-900">
                            Đáp án chuẩn:{' '}
                            <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-950 font-bold">
                              {typeof q.answerKey.correctAnswer === 'object'
                                ? JSON.stringify(q.answerKey.correctAnswer)
                                : String(q.answerKey.correctAnswer)}
                            </code>
                          </span>
                        </div>
                        <p className="text-emerald-800 leading-relaxed">
                          <strong>Hướng dẫn giải:</strong> {q.answerKey.explanation}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-mono">
                          Quy tắc chấm máy: {q.answerKey.gradingLogic}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
