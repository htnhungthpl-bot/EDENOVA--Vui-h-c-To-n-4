/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { NavigationTarget } from '../types/index.ts';
import { HomeworkAssignment, StudentSubmission } from '../types/curriculum.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StudentPracticeModal } from '../components/curriculum/StudentPracticeModal.tsx';
import { SubmissionResultModal } from '../components/curriculum/SubmissionResultModal.tsx';
import { PersonalizationGamificationView } from '../components/personalization/PersonalizationGamificationView.tsx';
import {
  Sparkles,
  BookOpen,
  Hash,
  Shapes,
  BarChart2,
  Compass,
  Bot,
  Play,
  Clock,
  Award,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export interface StudentDashboardProps {
  onNavigate: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
  onSelectLesson?: (lessonId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenUnimplemented,
  onSelectLesson,
}) => {
  const { session } = useAuth();
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Trạng thái làm bài
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>('');
  const [filterWrongIds, setFilterWrongIds] = useState<string[] | undefined>(undefined);

  // Trạng thái xem kết quả
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);

  const classId = session?.assignedClassIds?.[0] || 'school_alpha_4A';

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`/api/curriculum/assignments/class/${classId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Lỗi tải bài tập:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [session, classId]);

  const handleStartPractice = (assignmentId: string, wrongIds?: string[]) => {
    setActiveAssignmentId(assignmentId);
    setFilterWrongIds(wrongIds);
    setPracticeModalOpen(true);
  };

  const handleSubmissionSuccess = (submission: StudentSubmission) => {
    setCurrentSubmission(submission);
    setResultModalOpen(true);
  };

  const handleRetryWrong = (wrongIds: string[]) => {
    if (activeAssignmentId) {
      handleStartPractice(activeAssignmentId, wrongIds);
    }
  };

  const topics = [
    {
      title: 'Chủ đề 1: Số và Phép tính',
      code: 'TOAN4-C1',
      desc: 'Số tự nhiên, phép tính cộng/trừ/nhân/chia và phân số cơ bản.',
      icon: <Hash className="w-5 h-5 text-sky-600" />,
      color: 'bg-sky-50 border-sky-200',
    },
    {
      title: 'Chủ đề 2: Hình học & Đo lường',
      code: 'TOAN4-C2',
      desc: 'Góc nhọn, tù, bẹt; hai đường vuông góc, song song; đơn vị đo diện tích.',
      icon: <Shapes className="w-5 h-5 text-teal-600" />,
      color: 'bg-teal-50 border-teal-200',
    },
    {
      title: 'Chủ đề 3: Thống kê & Xác suất',
      code: 'TOAN4-C3',
      desc: 'Dãy số liệu thống kê đơn giản, biểu đồ cột và kiểm đếm khả năng xảy ra.',
      icon: <BarChart2 className="w-5 h-5 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Chủ đề 4: Thực hành & Trải nghiệm',
      code: 'TOAN4-C4',
      desc: 'Ứng dụng toán học vào các tình huống thực tế sinh động.',
      icon: <Compass className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner chào mừng học sinh */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F294A] to-sky-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chào mừng em {session?.name || 'học sinh'} đến với EDUNOVA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Góc Học tập – Vui học Toán 4
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            Lớp {classId}. Hãy hoàn thành các bài tập thầy cô giao và luyện tập với 8 dạng toán chuẩn GDPT 2018!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="md"
            icon={<BookOpen className="w-4 h-4" />}
            onClick={() => onNavigate('curriculum-catalog')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Danh mục 73 Bài học
          </Button>

          <Button
            variant="accent"
            size="md"
            icon={<Bot className="w-4 h-4" />}
            onClick={() => {
              if (onSelectLesson) {
                onSelectLesson('lesson_01');
              } else {
                onNavigate('curriculum-catalog');
              }
            }}
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold"
          >
            Hỏi Trợ giảng AI
          </Button>
        </div>
      </div>

      {/* KHU VỰC TRỢ GIẢNG AI SƯ PHẠM TRÊN DASHBOARD (GIAI ĐOẠN 5) */}
      <Card className="p-5 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white border-sky-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Trợ giảng Sư phạm Scaffolding AI EDUNOVA
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Đã kích hoạt • Giai đoạn 5
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Người thầy AI đồng hành: phân tích nguyên nhân sai sót, nhắc quy tắc SGK, gợi ý bước tiếp theo và đưa bài tập tương tự (tuyệt đối không giải hộ bài).
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => {
                if (onSelectLesson) {
                  onSelectLesson('lesson_01');
                } else {
                  onNavigate('curriculum-catalog');
                }
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Học cùng Trợ giảng AI ngay
            </Button>
          </div>
        </div>
      </Card>

      {/* GIAI ĐOẠN 6: CÁ NHÂN HÓA LUYỆN TẬP VÀ GAMIFICATION */}
      <PersonalizationGamificationView
        onNavigateToCatalog={() => onNavigate('curriculum-catalog')}
        onSelectLesson={onSelectLesson}
        onStartPractice={() => {
          if (assignments.length > 0) {
            handleStartPractice(assignments[0].id);
          } else {
            onNavigate('curriculum-catalog');
          }
        }}
      />

      {/* KHU VỰC BÀI TẬP ĐƯỢC GIAO CỦA HỌC SINH */}
      <Card>
        <CardHeader
          title="Nhiệm vụ học tập & Bài tập về nhà"
          subtitle={`Danh sách bài tập do giáo viên giao cho Lớp ${classId}`}
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={fetchAssignments}
            >
              Làm mới
            </Button>
          }
        />

        <div className="pt-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Đang tải danh sách bài tập...
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Award className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">Chưa có bài tập nào được giao cho lớp của em.</p>
              <p className="text-slate-500 max-w-md mx-auto">
                Khi thầy cô phát hành bài tập mới từ bài học đã duyệt, bài tập sẽ xuất hiện tại đây để em làm bài.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
                      ID: {asg.id}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Hạn nộp: {new Date(asg.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {asg.title}
                  </h3>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    Lời dặn: {asg.instructions}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Đề bài: <strong>{asg.questionIds.length} câu hỏi</strong>
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartPractice(asg.id)}
                      icon={<Play className="w-3.5 h-3.5" />}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
                    >
                      Làm bài ngay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 4 Mạch kiến thức Toán 4 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Các mạch kiến thức Toán lớp 4 (Chuẩn GDPT 2018)
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('curriculum-catalog')}
            icon={<BookOpen className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Khung 73 bài học
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t) => (
            <Card
              key={t.code}
              className="p-5 hover:border-sky-300 transition-all cursor-pointer"
              onClick={() => onNavigate('curriculum-catalog')}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border ${t.color}`}>
                  {t.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    {t.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal làm bài tập của học sinh */}
      <StudentPracticeModal
        isOpen={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        assignmentId={activeAssignmentId}
        classId={classId}
        filterQuestionIds={filterWrongIds}
        onSubmissionSuccess={handleSubmissionSuccess}
      />

      {/* Modal hiển thị kết quả chấm điểm quy tắc */}
      <SubmissionResultModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        submission={currentSubmission}
        onRetryWrongQuestions={handleRetryWrong}
      />
    </div>
  );
};
