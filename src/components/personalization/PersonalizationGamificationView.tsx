/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LearningAnalytics,
  PersonalizedRecommendation,
  GamificationProfile,
  GamificationBadge,
  StageMilestone,
  LearningMission,
} from '../../types/gamification.ts';
import {
  Sparkles,
  Award,
  Compass,
  Flame,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Target,
  BarChart3,
  TrendingUp,
  Brain,
  ShieldCheck,
  HeartHandshake,
  HelpCircle,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';

export interface PersonalizationGamificationViewProps {
  onNavigateToCatalog?: () => void;
  onSelectLesson?: (lessonId: string) => void;
  onStartPractice?: () => void;
}

export const PersonalizationGamificationView: React.FC<PersonalizationGamificationViewProps> = ({
  onNavigateToCatalog,
  onSelectLesson,
  onStartPractice,
}) => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'RECOMMENDATIONS' | 'MISSIONS_STAGES' | 'BADGES'>('RECOMMENDATIONS');

  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation | null>(null);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [badges, setBadges] = useState<GamificationBadge[]>([]);
  const [stages, setStages] = useState<StageMilestone[]>([]);
  const [missions, setMissions] = useState<LearningMission[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const [resAnalytics, resRec, resGamification] = await Promise.all([
        fetch('/api/personalization/analytics', { headers }),
        fetch('/api/personalization/recommendations', { headers }),
        fetch('/api/personalization/gamification', { headers }),
      ]);

      const [dataAnalytics, dataRec, dataGamification] = await Promise.all([
        resAnalytics.json(),
        resRec.json(),
        resGamification.json(),
      ]);

      if (dataAnalytics.success) setAnalytics(dataAnalytics.analytics);
      if (dataRec.success) setRecommendations(dataRec.recommendations);
      if (dataGamification.success) {
        setProfile(dataGamification.profile);
        setBadges(dataGamification.badges);
        setStages(dataGamification.stages);
        setMissions(dataGamification.missions);
      }
    } catch (err: unknown) {
      console.error('Lỗi tải dữ liệu cá nhân hóa:', err);
      setError('Không thể kết nối đến máy chủ cá nhân hóa. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  if (loading) {
    return (
      <Card className="p-8 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium">Đang tổng hợp dữ liệu học tập và lộ trình cá nhân hóa...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. THANH TRẠNG THÁI TIẾN TRÌNH & PROFILE GAMIFICATION */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F294A] via-sky-950 to-indigo-950 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-900 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Góc Cá nhân hóa & Tiến trình Học tập
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-sky-200">
                Giai đoạn 6 • Chuẩn Sư phạm
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Lộ trình riêng của {session?.name || 'Em học sinh'}
            </h2>
            <p className="text-xs text-sky-100/90 max-w-2xl leading-relaxed flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Tư duy phát triển (Growth Mindset):</strong> Khả năng toán học luôn tiến bộ qua từng bài luyện tập. Hệ thống không dán nhãn cố định và tuyệt đối không công khai bảng xếp hạng cá nhân.
              </span>
            </p>
          </div>

          {/* Huy hiệu sao tích lũy & chuỗi ngày */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
              <div className="text-[11px] text-amber-300 font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Sao Tích lũy
              </div>
              <div className="text-2xl font-black text-white">{profile?.totalStars || 0}</div>
            </div>

            <div className="p-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
              <div className="text-[11px] text-orange-300 font-semibold flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Chuỗi ngày học
              </div>
              <div className="text-2xl font-black text-white">{profile?.currentStreakDays || 1} <span className="text-xs font-normal">ngày</span></div>
            </div>

            <div className="p-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-center">
              <div className="text-[11px] text-sky-300 font-semibold flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-sky-300" />
                Huy hiệu đạt
              </div>
              <div className="text-2xl font-black text-white">{profile?.earnedBadges.length || 0} <span className="text-xs font-normal">/ {badges.length}</span></div>
            </div>
          </div>
        </div>

        {/* Thông báo cam kết bảo vệ tâm lý học sinh */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-sky-200/80 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chính sách: Tuyệt đối không bảng xếp hạng công khai gây áp lực tâm lý thi đua tiêu cực.</span>
          </div>
          <div className="text-sky-300">
            Mục tiêu: Động viên nỗ lực cá nhân & hình thành thói quen tự học kiên trì
          </div>
        </div>
      </div>

      {/* 2. CHỌN TAB NỘI DUNG */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('RECOMMENDATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'RECOMMENDATIONS'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          Đề xuất Minh bạch & Phân tích Dữ liệu ({analytics?.overallAccuracy || 0}%)
        </button>

        <button
          onClick={() => setActiveTab('MISSIONS_STAGES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'MISSIONS_STAGES'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          Nhiệm vụ & Chặng Thám hiểm ({stages.filter((s) => s.isUnlocked).length}/{stages.length})
        </button>

        <button
          onClick={() => setActiveTab('BADGES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'BADGES'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Bộ Huy hiệu Sư phạm ({profile?.earnedBadges.length || 0})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ĐỀ XUẤT MINH BẠCH & PHÂN TÍCH DỮ LIỆU THỰC TẾ           */}
      {/* ============================================================== */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div className="space-y-6">
          {/* TRƯỜNG HỢP 1: CHƯA ĐỦ DỮ LIỆU (DATA CONFIDENCE THRESHOLD) */}
          {!analytics?.isSufficientData ? (
            <Card className="p-8 border-dashed border-2 border-amber-300 bg-amber-50/60 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-950">
                  Chưa đủ dữ liệu để đề xuất lộ trình cá nhân hóa
                </h3>
                <p className="text-xs text-amber-800 max-w-lg mx-auto leading-relaxed">
                  Để đảm bảo tính chuẩn xác và không đưa ra nhận định vội vàng về năng lực của học sinh, EDUNOVA yêu cầu tối thiểu{' '}
                  <strong>{analytics?.confidenceThreshold.minSubmissionsRequired || 2} bài nộp</strong> hoặc{' '}
                  <strong>{analytics?.confidenceThreshold.minQuestionsRequired || 5} câu hỏi</strong> được hoàn thành.
                </p>
              </div>

              {/* Tiến trình thu thập dữ liệu */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-white border border-amber-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>Bài tập đã nộp:</span>
                  <span className="font-mono text-amber-700">
                    {analytics?.totalSubmissions || 0} / {analytics?.confidenceThreshold.minSubmissionsRequired || 2} bài
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((analytics?.totalSubmissions || 0) /
                          (analytics?.confidenceThreshold.minSubmissionsRequired || 2)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold pt-1">
                  <span>Số câu hỏi đã thực hiện:</span>
                  <span className="font-mono text-amber-700">
                    {analytics?.totalQuestionsAttempted || 0} / {analytics?.confidenceThreshold.minQuestionsRequired || 5} câu
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((analytics?.totalQuestionsAttempted || 0) /
                          (analytics?.confidenceThreshold.minQuestionsRequired || 5)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={<BookOpen className="w-4 h-4" />}
                  onClick={() => onStartPractice ? onStartPractice() : onNavigateToCatalog?.()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Làm thêm bài tập để nhận đề xuất cá nhân hóa
                </Button>
              </div>
            </Card>
          ) : (
            /* TRƯỜNG HỢP 2: ĐÃ ĐỦ DỮ LIỆU TIN CẬY */
            <div className="space-y-6">
              {/* Lời khuyên mức độ phù hợp & Growth Mindset */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                      Mức độ đề xuất: {recommendations?.recommendedDifficulty.level}
                    </span>
                    <span className="text-xs text-emerald-800 font-bold">
                      Độ chính xác hiện tại: {analytics?.overallAccuracy}% ({analytics?.totalQuestionsCorrect}/{analytics?.totalQuestionsAttempted} câu)
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {recommendations?.recommendedDifficulty.explanation}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-emerald-700 font-semibold bg-white p-2.5 rounded-xl border border-emerald-200">
                  {recommendations?.statusMessage}
                </div>
              </div>

              {/* BÀI LUYỆN TẬP ĐỀ XUẤT (CÓ MINH BẠCH LÝ DO SƯ PHẠM) */}
              <Card>
                <CardHeader
                  title="Bài luyện bổ sung theo quy tắc minh bạch"
                  subtitle="Hệ thống luôn nêu rõ lý do sư phạm vì sao đề xuất bài học này cho em"
                />
                <div className="p-5 pt-0 space-y-3">
                  {recommendations?.recommendedLessons.map((rec) => (
                    <div
                      key={rec.lessonId}
                      className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {rec.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            Ưu tiên: {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-sky-100 leading-relaxed">
                          <strong className="text-sky-800">Lý do sư phạm:</strong> {rec.reason}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                          onClick={() => {
                            if (onSelectLesson) onSelectLesson(rec.lessonId);
                            else onNavigateToCatalog?.();
                          }}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
                        >
                          Ôn bài ngay
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* KIẾN THỨC VÀ QUY TẮC SGK CẦN ÔN TẬP */}
              {recommendations && recommendations.reviewConcepts.length > 0 && (
                <Card>
                  <CardHeader
                    title="Quy tắc & Kiến thức SGK Toán 4 cần ôn kỹ"
                    subtitle="Đúc kết trực tiếp từ các câu hỏi mà em còn băn khoăn hoặc làm chưa chính xác"
                  />
                  <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.reviewConcepts.map((concept, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {concept.conceptName}
                          </h4>
                        </div>
                        <div className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-amber-100 leading-relaxed font-serif">
                          📖 <strong>Quy tắc SGK:</strong> {concept.ruleSummary}
                        </div>
                        <div className="text-[11px] text-amber-800 italic">
                          Lý do ôn tập: {concept.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* GỢI Ý DÀNH CHO GIÁO VIÊN & PHỤ HUYNH */}
              {recommendations && recommendations.teacherInsights.length > 0 && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardHeader
                    title="Gợi ý hành động sư phạm dành cho Thầy Cô & Phụ huynh"
                    subtitle="Các quan sát thực tế để đồng hành và hỗ trợ học sinh một cách tích cực"
                  />
                  <div className="p-5 pt-0 space-y-3">
                    {recommendations.teacherInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-indigo-100 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <h4 className="font-bold text-slate-900 text-xs">
                            Chủ đề: {insight.topic}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Quan sát thực tế:</strong> {insight.observation}
                        </p>
                        <p className="text-xs text-indigo-900 bg-indigo-50/70 p-2 rounded border border-indigo-100">
                          🎯 <strong>Khuyến nghị can thiệp:</strong> {insight.suggestedIntervention}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* PHÂN TÍCH DỮ LIỆU THỰC TẾ (LEARNING ANALYTICS DETAILS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dạng lỗi sai thường gặp (Error Breakdown) */}
                <Card>
                  <CardHeader
                    title="Phân tích dạng lỗi sai (Error Patterns)"
                    subtitle="Phân loại theo chuẩn sư phạm giúp khắc phục đúng gốc rễ"
                  />
                  <div className="p-5 pt-0 space-y-3">
                    {analytics?.errorBreakdown.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
                        🎉 Tuyệt vời! Em chưa mắc phải mẫu lỗi nghiêm trọng nào trong các bài nộp gần đây.
                      </div>
                    ) : (
                      analytics?.errorBreakdown.map((errItem) => (
                        <div
                          key={errItem.errorTag}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              {errItem.errorLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Gặp {errItem.count} lần
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {errItem.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Mức độ làm chủ theo 4 mạch kiến thức */}
                <Card>
                  <CardHeader
                    title="Mức độ làm chủ theo Mạch kiến thức"
                    subtitle="4 mạch chương trình Toán 4 theo Chương trình GDPT 2018"
                  />
                  <div className="p-5 pt-0 space-y-3">
                    {analytics?.strandMastery.map((st) => (
                      <div
                        key={st.strandCode}
                        className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">{st.strandName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.masteryLevel === 'XUAT_SAC'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.masteryLevel === 'DAT'
                              ? 'bg-sky-100 text-sky-800'
                              : st.masteryLevel === 'DANG_TIEN_BO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {st.accuracy}% • {st.masteryLevel}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              st.accuracy >= 75 ? 'bg-emerald-500' : st.accuracy >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${st.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Lịch sử điểm số theo thời gian (Performance over time) */}
              {analytics && analytics.performanceOverTime.length > 0 && (
                <Card>
                  <CardHeader
                    title="Tiến trình làm bài qua từng đợt luyện tập"
                    subtitle="Xem lại kết quả các bài tập đã nộp để thấy sự tiến bộ của bản thân"
                  />
                  <div className="p-5 pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Thời gian</th>
                            <th className="p-3">Bài tập</th>
                            <th className="p-3 text-center">Điểm số</th>
                            <th className="p-3 text-center">Độ chính xác</th>
                            <th className="p-3 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analytics.performanceOverTime.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-500">
                                {new Date(p.date).toLocaleString('vi-VN')}
                              </td>
                              <td className="p-3 font-semibold text-slate-900">
                                {p.assignmentTitle}
                              </td>
                              <td className="p-3 text-center font-mono">
                                {p.score}/{p.maxScore}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-sky-700">
                                {p.accuracy}%
                              </td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.accuracy >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {p.accuracy >= 80 ? 'Hoàn thành tốt' : 'Cần củng cố thêm'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: NHIỆM VỤ HỌC TẬP & CÁC CHẶNG THÁM HIỂM (STAGES & MISSIONS) */}
      {/* ============================================================== */}
      {activeTab === 'MISSIONS_STAGES' && (
        <div className="space-y-6">
          {/* CÁC CHẶNG HỌC TẬP (STAGE MILESTONES) */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Các Chặng Thám hiểm Toán 4 (Stage Milestones)
              </h3>
              <p className="text-xs text-slate-600">
                Mỗi chặng mở khóa theo điều kiện hoàn thành bài học, gắn liền với mục tiêu giáo dục chuẩn chương trình.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    stage.isUnlocked
                      ? 'bg-white border-sky-300 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2.5 rounded-xl ${
                        stage.isUnlocked ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {stage.isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                          Chặng {stage.stageNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {stage.title}
                        </h4>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      stage.isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {stage.isUnlocked ? 'ĐÃ MỞ KHÓA' : 'CHƯA MỞ KHÓA'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="mt-3 p-2.5 rounded-lg bg-sky-50/60 border border-sky-100 text-[11px] text-sky-900">
                    <strong>Điều kiện:</strong> {stage.unlockConditionText}
                  </div>

                  {/* Mục tiêu giáo dục bắt buộc */}
                  <div className="mt-2.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    🎯 <strong>Mục tiêu giáo dục:</strong> {stage.pedagogicalObjective}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CÁC NHIỆM VỤ HỌC TẬP (DAILY & WEEKLY LEARNING MISSIONS) */}
          <Card>
            <CardHeader
              title="Nhiệm vụ học tập sư phạm (Learning Missions)"
              subtitle="Khởi động ngày mới, vượt thử thách và rèn luyện thói quen tự học"
            />
            <div className="p-5 pt-0 space-y-3">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className={`p-4 rounded-xl border transition-all ${
                    mission.isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {mission.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Target className="w-4 h-4 text-sky-600" />
                        )}
                        <h4 className="font-bold text-slate-900 text-xs">
                          {mission.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          +{mission.rewardStars} Sao
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{mission.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-700">
                          {mission.currentCount} / {mission.targetCount}
                        </div>
                        <div className="text-[10px] text-slate-400">Tiến trình</div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        mission.isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {mission.isCompleted ? 'Đã hoàn thành' : 'Đang thực hiện'}
                      </span>
                    </div>
                  </div>

                  {/* Mục tiêu giáo dục của nhiệm vụ */}
                  <div className="mt-2.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                    📖 {mission.pedagogicalObjective}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: BỘ HUY HIỆU SƯ PHẠM (ACHIEVEMENTS / PEDAGOGICAL BADGES)  */}
      {/* ============================================================== */}
      {activeTab === 'BADGES' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Nguyên tắc Sư phạm trong Gamification EDUNOVA:</strong> Mỗi huy hiệu được thiết kế nhằm khuyến khích một thái độ học tập tích cực (nỗ lực bền bỉ, không sợ sai, cẩn thận, tự giác) thay vì tạo áp lực cạnh tranh điểm số.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  badge.isEarned
                    ? 'bg-white border-amber-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                      badge.isEarned
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 border border-amber-400'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {badge.category === 'EFFORT' && <Sparkles className="w-6 h-6" />}
                      {badge.category === 'PERSISTENCE' && <RotateCcw className="w-6 h-6" />}
                      {badge.category === 'MASTERY' && <Award className="w-6 h-6" />}
                      {badge.category === 'MILESTONE' && <Compass className="w-6 h-6" />}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      badge.isEarned
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {badge.isEarned ? 'ĐÃ ĐẠT ĐƯỢC' : 'CHƯA ĐẠT'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{badge.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* MỤC TIÊU GIÁO DỤC BẮT BUỘC CỦA HUY HIỆU */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                    🎯 <strong>Mục tiêu giáo dục:</strong> {badge.pedagogicalObjective}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Phân loại: {badge.category}</span>
                  {badge.earnedAt && (
                    <span className="font-mono text-emerald-700 font-semibold">
                      Nhận ngày: {new Date(badge.earnedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
