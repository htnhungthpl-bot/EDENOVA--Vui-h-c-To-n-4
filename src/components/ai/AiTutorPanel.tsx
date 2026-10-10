/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  AiRequestType,
  AiScaffoldingOutput,
  AiUserQuotaInfo,
} from '../../types/ai.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import {
  Bot,
  Sparkles,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Send,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  FileEdit,
  Smile,
  Info,
} from 'lucide-react';

interface AiTutorPanelProps {
  lessonId: string;
  lessonTitle: string;
  lessonStatus: string;
  onRefresh?: () => void;
}

export const AiTutorPanel: React.FC<AiTutorPanelProps> = ({
  lessonId,
  lessonTitle,
  lessonStatus,
}) => {
  const { session } = useAuth();
  const [requestType, setRequestType] = useState<AiRequestType>('HINT_STEP');
  const [userQuery, setUserQuery] = useState('');
  const [studentAttempt, setStudentAttempt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AiScaffoldingOutput | null>(null);
  const [quota, setQuota] = useState<AiUserQuotaInfo | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(true);

  const isStudent = session?.role === 'STUDENT';
  const isTeacher = session?.role === 'TEACHER';
  const isPrivileged = session?.role === 'TEACHER' || session?.role === 'CONTENT_REVIEWER' || session?.role === 'SUPER_ADMIN';
  const isLessonApproved = lessonStatus === 'APPROVED';

  // Lấy trạng thái cấu hình AI và hạn mức hiện tại
  useEffect(() => {
    async function fetchAiStatus() {
      try {
        const headers: Record<string, string> = {};
        if (session?.token) {
          headers['Authorization'] = `Bearer ${session.token}`;
        }
        const res = await fetch('/api/ai/status', { headers });
        const data = await res.json();
        if (data.success) {
          setIsConfigured(data.isConfigured);
          setIsAiEnabled(data.isAiEnabled);
          if (data.userQuota) {
            setQuota(data.userQuota);
          }
        }
      } catch {
        // Bỏ qua lỗi trạng thái ban đầu
      }
    }
    fetchAiStatus();
  }, [session]);

  const handleAskAi = async (overrideType?: AiRequestType, overrideQuery?: string) => {
    const typeToUse = overrideType || requestType;
    const queryToUse = overrideQuery !== undefined ? overrideQuery : userQuery;

    if (!session?.token) {
      setError('Vui lòng đăng nhập để sử dụng Trợ giảng AI.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (typeToUse.startsWith('TEACHER_')) {
        // Chế độ giáo viên soạn nháp
        const res = await fetch('/api/ai/teacher-draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            lessonId,
            draftType: typeToUse,
            customRequirement: queryToUse || 'Soạn nháp nội dung sư phạm hỗ trợ bài học',
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          setResponse(data.data);
          if (data.quota) setQuota(data.quota);
        } else {
          setError(data.error || 'Không thể tạo bản thảo từ AI.');
        }
      } else {
        // Chế độ học sinh / hỏi đáp Scaffolding
        const res = await fetch('/api/ai/scaffolding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            lessonId,
            requestType: typeToUse,
            userQuery: queryToUse,
            studentAttempt: studentAttempt.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          setResponse(data.data);
          if (data.quota) setQuota(data.quota);
        } else {
          setError(data.error || 'Trợ giảng AI tạm thời không thể phản hồi.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Kiểm tra an toàn: Học sinh không được truy cập học liệu chưa duyệt
  if (isStudent && !isLessonApproved) {
    return (
      <Card className="p-6 bg-slate-50 border-2 border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Trợ giảng AI EDUNOVA: Học liệu đang thẩm định</span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bài học <strong>[{lessonTitle}]</strong> hiện đang được Thẩm định viên (CONTENT_REVIEWER) kiểm duyệt.
              Theo nguyên tắc an toàn sư phạm của EDUNOVA, Trợ giảng AI chỉ mở hướng dẫn cho học sinh sau khi học liệu được phê duyệt chính thức (APPROVED).
            </p>
            <p className="text-[11px] text-slate-500 italic">
              * Khi bài học được phê duyệt, em sẽ có thể đặt câu hỏi gợi ý và luyện bài tập cùng AI tại đây!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/20 border-sky-200 shadow-sm">
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Trợ giảng Sư phạm Scaffolding AI
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Đồng hành tư duy từng bước • Không giải hộ toàn bộ bài kiểm tra
              </p>
            </div>
          </div>

          {/* Quota & Status Badges */}
          <div className="flex items-center gap-2">
            {!isConfigured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                AI chưa cấu hình
              </span>
            )}
            {!isAiEnabled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800 border border-rose-200">
                AI tạm ngưng
              </span>
            )}
            {quota && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  quota.nearQuota
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span>Hạn mức hôm nay:</span>
                <span className="font-mono">
                  {quota.usedToday}/{quota.dailyLimit}
                </span>
                <span className="text-[10px] font-normal">
                  (Còn {quota.remaining} lượt)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cảnh báo cấu hình nếu chưa có khóa API */}
        {!isConfigured && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Hệ thống AI chưa được cấu hình khóa GEMINI_API_KEY</p>
              <p className="text-[11px] text-amber-800">
                Khóa API chưa được nạp từ Secrets của dự án. Quản trị viên vui lòng cấu hình khóa trong bảng điều khiển <strong>Settings &gt; Secrets</strong> để kích hoạt tính năng Trợ giảng AI.
              </p>
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Chọn nội dung em muốn Thầy/Cô AI hỗ trợ:
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={requestType === 'HINT_STEP' ? 'primary' : 'outline'}
              size="sm"
              icon={<Lightbulb className="w-3.5 h-3.5" />}
              className="text-xs"
              onClick={() => {
                setRequestType('HINT_STEP');
                setUserQuery('Gợi ý cho em bước tiếp theo để giải bài này.');
                handleAskAi('HINT_STEP', 'Gợi ý cho em bước tiếp theo để giải bài này.');
              }}
            >
              Gợi ý bước giải tiếp theo
            </Button>

            <Button
              variant={requestType === 'EXPLAIN_ERROR' ? 'primary' : 'outline'}
              size="sm"
              icon={<HelpCircle className="w-3.5 h-3.5" />}
              className="text-xs"
              onClick={() => {
                setRequestType('EXPLAIN_ERROR');
              }}
            >
              Phân tích vì sao em làm sai
            </Button>

            <Button
              variant={requestType === 'SIMILAR_EXAMPLE' ? 'primary' : 'outline'}
              size="sm"
              icon={<BookOpen className="w-3.5 h-3.5" />}
              className="text-xs"
              onClick={() => {
                setRequestType('SIMILAR_EXAMPLE');
                setUserQuery('Cho em một ví dụ tương tự để em tự luyện tập lại.');
                handleAskAi('SIMILAR_EXAMPLE', 'Cho em một ví dụ tương tự để em tự luyện tập lại.');
              }}
            >
              Cho bài tập tương tự
            </Button>

            {/* Chế độ dành cho Giáo viên */}
            {isPrivileged && (
              <>
                <Button
                  variant={requestType === 'TEACHER_DRAFT_QUESTION' ? 'primary' : 'outline'}
                  size="sm"
                  icon={<FileEdit className="w-3.5 h-3.5" />}
                  className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  onClick={() => {
                    setRequestType('TEACHER_DRAFT_QUESTION');
                    setUserQuery('Soạn nháp một câu hỏi trắc nghiệm kèm gợi ý tương tự bài này.');
                  }}
                >
                  GV: Soạn nháp câu hỏi (Chờ duyệt)
                </Button>
                <Button
                  variant={requestType === 'TEACHER_DRAFT_EXPLANATION' ? 'primary' : 'outline'}
                  size="sm"
                  icon={<FileEdit className="w-3.5 h-3.5" />}
                  className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  onClick={() => {
                    setRequestType('TEACHER_DRAFT_EXPLANATION');
                    setUserQuery('Soạn nháp gợi ý phản hồi sư phạm cho các lỗi sai học sinh hay gặp.');
                  }}
                >
                  GV: Soạn phản hồi sư phạm (Chờ duyệt)
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Input box khi hỏi chi tiết hoặc giải thích lỗi sai */}
        {requestType === 'EXPLAIN_ERROR' && (
          <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-amber-900 block">
              Câu trả lời hoặc suy nghĩ của em vừa làm:
            </label>
            <input
              type="text"
              value={studentAttempt}
              onChange={(e) => setStudentAttempt(e.target.value)}
              placeholder="Ví dụ: Em tính ra kết quả là 8 000 vì em nghĩ chữ số 8 ở hàng nghìn..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}

        {/* Form nhập câu hỏi tùy chỉnh */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAskAi()}
            placeholder={
              requestType === 'EXPLAIN_ERROR'
                ? 'Em thắc mắc gì thêm về lỗi này không?'
                : 'Nhập câu hỏi toán học của em cho bài này...'
            }
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAskAi()}
            disabled={loading}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            className="bg-sky-600 hover:bg-sky-700 text-white shrink-0 px-4"
          >
            {loading ? 'Đang suy nghĩ...' : 'Hỏi AI'}
          </Button>
        </div>

        {error && (
          <div className="mt-3">
            <Alert type="error" onDismiss={() => setError(null)}>{error}</Alert>
          </div>
        )}

        {/* Render Kết quả Scaffolding Sư phạm */}
        {response && (
          <div className="mt-5 space-y-3.5 pt-4 border-t border-sky-100 animate-fadeIn">
            {/* Huy hiệu bản thảo đối với Giáo viên */}
            {response.isDraft && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs text-indigo-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-indigo-600" />
                  Bản thảo sư phạm do AI tạo (DRAFT)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Trạng thái: Chờ duyệt (PENDING_REVIEW)
                </span>
              </div>
            )}

            {/* 1. Nhận xét & Phân tích nguyên nhân sai sót */}
            {response.misconceptionAnalysis && (
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  <span>Phân tích nguyên nhân & Nhận xét tư duy:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-6">
                  {response.misconceptionAnalysis}
                </p>
              </div>
            )}

            {/* 2. Quy tắc SGK cốt lõi cần nhớ */}
            {response.ruleReminder && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Quy tắc SGK cốt lõi cần nhớ:</span>
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed pl-6">
                  {response.ruleReminder}
                </p>
              </div>
            )}

            {/* 3. Gợi ý bước giải tiếp theo (KHÔNG LÀM HỘ) */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                <span>Gợi ý bước giải tiếp theo:</span>
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed pl-6">
                {response.nextStepHint}
              </p>
            </div>

            {/* 4. Ví dụ tương tự để tự luyện */}
            {response.similarExample && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Ví dụ tương tự để em tự thử sức:</span>
                </div>
                <div className="pl-6 space-y-1.5 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {response.similarExample.problem}
                  </p>
                  <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded-lg border border-indigo-100">
                    💡 Hướng dẫn: {response.similarExample.hint}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Lời khích lệ học sinh */}
            {response.encouragement && (
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-900 font-medium">
                <Smile className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{response.encouragement}</span>
              </div>
            )}

            {/* Tuyên bố miễn trừ trách nhiệm sư phạm */}
            <p className="text-[10px] text-slate-400 text-center italic">
              {response.disclaimer}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
