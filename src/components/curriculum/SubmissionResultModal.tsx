/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { StudentSubmission } from '../../types/curriculum.ts';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export interface SubmissionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: StudentSubmission | null;
  onRetryWrongQuestions?: (wrongQuestionIds: string[]) => void;
}

export const SubmissionResultModal: React.FC<SubmissionResultModalProps> = ({
  isOpen,
  onClose,
  submission,
  onRetryWrongQuestions,
}) => {
  if (!submission) return null;

  const wrongAnswers = submission.answers.filter((a) => !a.isCorrect);
  const hasWrongAnswers = wrongAnswers.length > 0;
  const isPerfect = submission.accuracyPercentage === 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kết quả bài làm – Chấm điểm quy tắc chuẩn"
      description="Bài làm được chấm điểm hoàn toàn tự động bằng thuật toán logic toán học xác định (100% Deterministic, không phụ thuộc AI)."
      maxWidth="lg"
    >
      <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Score Card Header */}
        <div
          className={`p-6 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isPerfect
              ? 'bg-gradient-to-r from-emerald-700 to-[#0F294A]'
              : 'bg-gradient-to-r from-sky-800 to-indigo-900'
          }`}
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Chấm điểm tự động hoàn tất</span>
            </div>
            <h3 className="text-xl font-bold">
              {isPerfect ? 'Xuất sắc! Em làm đúng toàn bộ!' : 'Hoàn thành bài tập!'}
            </h3>
            <p className="text-slate-200 text-xs">
              Mã kết quả: <span className="font-mono">{submission.id}</span> • Nộp lúc: {new Date(submission.submittedAt).toLocaleTimeString('vi-VN')}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-3.5 rounded-xl border border-white/20 shrink-0">
            <div className="text-center">
              <span className="text-[11px] text-slate-200 block">Tổng điểm</span>
              <span className="text-2xl font-black text-amber-300">
                {submission.totalScore}
                <span className="text-sm font-normal text-slate-300">/{submission.maxScore}</span>
              </span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <span className="text-[11px] text-slate-200 block">Độ chính xác</span>
              <span className="text-2xl font-black text-emerald-300">
                {submission.accuracyPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Cảnh báo Sư phạm & Nút Luyện lại các câu sai */}
        {hasWrongAnswers ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>Em có {wrongAnswers.length} câu chưa làm đúng.</span>
              </p>
              <p className="text-amber-800 text-[11px]">
                Phương pháp sư phạm khuyến khích em đọc kỹ lời giải bên dưới và luyện tập lại riêng các câu sai này để củng cố kiến thức.
              </p>
            </div>

            {onRetryWrongQuestions && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  onRetryWrongQuestions(wrongAnswers.map((w) => w.questionId));
                  onClose();
                }}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                className="shrink-0 font-bold"
              >
                Luyện lại {wrongAnswers.length} câu sai
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Em đã nắm vững toàn bộ kiến thức bài học này. Chúc mừng em tiếp tục phát huy ở các bài học tiếp theo!
            </span>
          </div>
        )}

        {/* Danh sách từng câu hỏi và lời giải chi tiết */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
            Chi tiết từng câu hỏi & Hướng dẫn sư phạm:
          </h4>

          {submission.answers.map((ans, idx) => (
            <div
              key={ans.questionId}
              className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                ans.isCorrect
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-rose-50/40 border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Câu {idx + 1}:</span>
                  <span className="text-[11px] font-mono text-slate-500">[{ans.questionId}]</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                    {ans.pointsAwarded} điểm
                  </span>
                </div>

                <div className="shrink-0">
                  {ans.isCorrect ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Chính xác
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full text-[11px]">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Chưa chính xác
                    </span>
                  )}
                </div>
              </div>

              {/* Câu trả lời của học sinh */}
              <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-600">Câu trả lời của em: </span>
                <span className="font-bold text-slate-900">
                  {ans.studentAnswer === null || ans.studentAnswer === undefined || ans.studentAnswer === ''
                    ? '(Để trống)'
                    : typeof ans.studentAnswer === 'object'
                    ? JSON.stringify(ans.studentAnswer)
                    : String(ans.studentAnswer)}
                </span>
              </div>

              {/* Đáp án chuẩn và lời giải chi tiết */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Đáp án chuẩn:</span>
                  <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-900 text-xs">
                    {ans.correctAnswerDisplay || 'Chuẩn xác'}
                  </code>
                </div>

                {ans.explanation && (
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    <strong className="text-slate-900">Hướng dẫn giải:</strong> {ans.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Đóng bảng kết quả
          </Button>
        </div>
      </div>
    </Modal>
  );
};
