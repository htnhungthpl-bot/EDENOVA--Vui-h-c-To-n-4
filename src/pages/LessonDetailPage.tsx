/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { CurriculumLessonItem, LessonReviewStatus } from '../types/curriculum.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AiTutorPanel } from '../components/ai/AiTutorPanel.tsx';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  Lightbulb,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Globe2,
  Award,
  ChevronRight,
  Bot,
  ShieldCheck,
  XCircle,
  FileCheck,
} from 'lucide-react';

export interface LessonDetailPageProps {
  lessonId: string;
  onBack: () => void;
  onPracticeClick?: (lessonId: string) => void;
}

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({
  lessonId,
  onBack,
  onPracticeClick,
}) => {
  const { session } = useAuth();
  const [lesson, setLesson] = useState<CurriculumLessonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`/api/curriculum/lessons/${lessonId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setLesson(data.lesson);
      } else {
        setError(data.error || 'Không tải được bài học');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!session) return;
    setReviewLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/curriculum/review-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          lessonId,
          action,
          reason: action === 'APPROVE' ? 'Nội dung đạt chuẩn GDPT 2018' : 'Cần bổ sung ví dụ',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchLesson();
      } else {
        setError(data.error || 'Lỗi thao tác thẩm định');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Đang nạp chi tiết bài học từ máy chủ...
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-4">
        <Alert type="error">{error || 'Không tìm thấy bài học.'}</Alert>
        <Button variant="outline" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
          Quay lại danh mục
        </Button>
      </div>
    );
  }

  const { content } = lesson;
  const isReviewerOrAdmin = session?.role === 'CONTENT_REVIEWER' || session?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Quay lại danh mục 73 bài
        </Button>

        <div className="flex items-center gap-2">
          {lesson.status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ĐÃ DUYỆT (ĐỦ ĐIỀU KIỆN GIAO BÀI)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              CHỜ DUYỆT (CHƯA ĐƯỢC GIAO HỌC SINH)
            </span>
          )}
        </div>
      </div>

      {actionMessage && <Alert type="success" onDismiss={() => setActionMessage(null)}>{actionMessage}</Alert>}
      {error && <Alert type="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F294A] to-sky-900 text-white shadow-sm space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-sky-200 text-xs font-mono font-semibold">
            Vị trí #{lesson.positionNumber} • {lesson.strandCode}
          </span>
          {lesson.topicTitle && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-medium">
              {lesson.topicTitle}
            </span>
          )}
          {lesson.bookVolume && (
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-xs">
              Tập {lesson.bookVolume} • Trang {lesson.page}
            </span>
          )}
          <span className="text-xs text-sky-300">SGK Kết nối tri thức với cuộc sống</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {lesson.title}
        </h1>
        {lesson.notes && (
          <p className="text-xs sm:text-sm text-slate-200 max-w-3xl">
            {lesson.notes}
          </p>
        )}
      </div>

      {/* Reviewer Action Bar (Nếu đăng nhập là CONTENT_REVIEWER / SUPER_ADMIN) */}
      {isReviewerOrAdmin && (
        <Card className="p-4 bg-amber-50/50 border-amber-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>Bảng thẩm định chuyên môn sư phạm</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Bạn đang đăng nhập với quyền <strong>[{session?.role}]</strong>. Hãy đối soát cấu trúc 9 phần và bấm phê duyệt để giáo viên được phép giao bài.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lesson.status !== 'APPROVED' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleReviewAction('APPROVE')}
                  disabled={reviewLoading}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Phê duyệt bài học
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReviewAction('REJECT')}
                  disabled={reviewLoading}
                  icon={<XCircle className="w-4 h-4" />}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Rút duyệt / Yêu cầu sửa
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* NỘI DUNG 9 PHẦN SƯ PHẠM CHUẨN */}
      {content ? (
        <div className="space-y-6">
          {/* PHẦN 1: MỤC TIÊU BÀI HỌC */}
          <Card className="p-5 border-l-4 border-l-sky-600">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm mb-3">
              <Target className="w-4 h-4 text-sky-600" />
              <span>1. Mục tiêu bài học (Objectives)</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
              {content.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </Card>

          {/* PHẦN 2: KHỞI ĐỘNG */}
          <Card className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>2. Khởi động (Warm-up)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">{content.warmUp.activityTitle}</p>
              <p className="leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                {content.warmUp.description}
              </p>
              {content.warmUp.questionPrompt && (
                <p className="font-medium text-amber-900">
                  Câu hỏi gợi mở: <span className="italic">{content.warmUp.questionPrompt}</span>
                </p>
              )}
            </div>
          </Card>

          {/* PHẦN 3: KIẾN THỨC TRỌNG TÂM */}
          <Card className="p-5 border-l-4 border-l-indigo-600">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-3">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>3. Kiến thức trọng tâm (Core Knowledge)</span>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-medium text-slate-900 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 leading-relaxed">
                {content.coreKnowledge.summary}
              </p>
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-800">Quy tắc ghi nhớ:</p>
                <ul className="space-y-1 list-disc list-inside pl-2">
                  {content.coreKnowledge.rules.map((rule, i) => (
                    <li key={i} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>
              {content.coreKnowledge.diagramNote && (
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 font-mono text-[11px]">
                  📌 Sơ đồ kiến thức: {content.coreKnowledge.diagramNote}
                </div>
              )}
            </div>
          </Card>

          {/* PHẦN 4: VÍ DỤ MINH HỌA */}
          <Card className="p-5 border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-3">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>4. Ví dụ minh họa (Examples)</span>
            </div>
            <div className="space-y-4 text-xs">
              {content.examples.map((ex, i) => (
                <div key={i} className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-2">
                  <p className="font-bold text-slate-900">Ví dụ {i + 1}: {ex.problem}</p>
                  <div className="space-y-1 pl-2 border-l-2 border-emerald-300">
                    {ex.solutionSteps.map((step, idx) => (
                      <p key={idx} className="text-slate-700 leading-relaxed">{step}</p>
                    ))}
                  </div>
                  <p className="font-semibold text-emerald-800">
                    Đáp số / Kết luận: <span className="font-bold">{ex.answer}</span>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* PHẦN 5: LUYỆN TẬP CƠ BẢN */}
          <Card className="p-5 border-l-4 border-l-sky-500">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm mb-3">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>5. Luyện tập cơ bản (Basic Practice)</span>
            </div>
            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              {content.basicPractice.map((item, i) => (
                <li key={i} className="p-2 rounded bg-slate-50 border border-slate-100">{item}</li>
              ))}
            </ol>
          </Card>

          {/* PHẦN 6: LUYỆN TẬP NÂNG CAO */}
          <Card className="p-5 border-l-4 border-l-violet-600">
            <div className="flex items-center gap-2 text-violet-900 font-bold text-sm mb-3">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <span>6. Luyện tập nâng cao (Advanced Practice)</span>
            </div>
            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              {content.advancedPractice.map((item, i) => (
                <li key={i} className="p-2 rounded bg-violet-50/50 border border-violet-100">{item}</li>
              ))}
            </ol>
          </Card>

          {/* PHẦN 7: VẬN DỤNG THỰC TẾ */}
          <Card className="p-5 border-l-4 border-l-teal-600">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm mb-3">
              <Globe2 className="w-4 h-4 text-teal-600" />
              <span>7. Vận dụng thực tế (Application)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100">
                <p className="font-semibold text-teal-900">Tình huống thực tế:</p>
                <p className="leading-relaxed mt-1">{content.application.realLifeScenario}</p>
              </div>
              <p className="font-medium text-slate-900">
                Nhiệm vụ: <span className="text-teal-800">{content.application.task}</span>
              </p>
            </div>
          </Card>

          {/* PHẦN 8: KẾT QUẢ CẦN ĐẠT & GỢI Ý HỌC TIẾP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>8. Kết quả cần đạt</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {content.resultsSummary}
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-l-sky-500">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-sm mb-2">
                <ChevronRight className="w-4 h-4 text-sky-600" />
                <span>9. Gợi ý học tiếp</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {content.nextSuggestions}
              </p>
            </Card>
          </div>

          {/* TRỢ GIẢNG SƯ PHẠM SCAFFOLDING AI EDUNOVA (GIAI ĐOẠN 5) */}
          <AiTutorPanel
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            lessonStatus={lesson.status}
          />

          {/* NÚT THỰC HÀNH DÀNH CHO HỌC SINH */}
          {onPracticeClick && (
            <div className="pt-4 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onPracticeClick(lesson.id)}
                icon={<Award className="w-5 h-5" />}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
              >
                Làm bài tập vận dụng cho bài học này
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-10 text-center text-slate-600 text-xs space-y-3">
          <BookOpen className="w-10 h-10 text-sky-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">
            {lesson.title}
          </h3>
          <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
            Bài học đã được đối chiếu chuẩn xác theo danh mục SGK Toán 4 ({lesson.sourceBook || 'Bộ sách Kết nối tri thức với cuộc sống'}, {lesson.topicTitle}, Trang {lesson.page}).
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full text-sky-700 font-medium">
            <span>Mạch kiến thức: {lesson.strandCode}</span> • <span>Tập {lesson.bookVolume}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Nội dung chi tiết 9 phần sư phạm đang được chuẩn bị và thẩm định trước khi mở cho học sinh làm bài.
          </p>
        </Card>
      )}
    </div>
  );
};
