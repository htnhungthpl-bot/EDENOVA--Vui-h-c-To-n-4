/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Table, Column } from '../components/ui/Table.tsx';
import { NavigationTarget } from '../types/index.ts';
import { HomeworkAssignment } from '../types/curriculum.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AssignHomeworkModal } from '../components/curriculum/AssignHomeworkModal.tsx';
import { TeacherClassReportView } from '../components/reporting/TeacherClassReportView.tsx';
import {
  Users,
  Plus,
  BookOpen,
  Calendar,
  Send,
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  BarChart3,
  FileText,
} from 'lucide-react';

export interface TeacherDashboardProps {
  onNavigate: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
  onSelectLesson?: (lessonId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigate,
  onOpenUnimplemented,
  onSelectLesson,
}) => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'ASSIGNMENTS' | 'REPORT'>('ASSIGNMENTS');
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const classId = session?.assignedClassIds?.[0] || 'school_alpha_4A';

  const fetchAssignments = async () => {
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
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [session, classId]);

  return (
    <div className="space-y-6">
      {/* Banner Giáo viên */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-[#0F294A] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Phân hệ Nghiệp vụ Sư phạm • Lớp 4A</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Bàn làm việc Giáo viên – Toán 4
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            Quản lý bài tập theo chuẩn GDPT 2018, giao bài tập tự động từ bài học đã kiểm duyệt và theo dõi kết quả chấm điểm quy tắc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="accent"
            size="md"
            icon={<Send className="w-4 h-4" />}
            onClick={() => setAssignModalOpen(true)}
            className="font-bold shadow-md"
          >
            Giao bài tập mới
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<BookOpen className="w-4 h-4" />}
            onClick={() => onNavigate('curriculum-catalog')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            73 Bài học Toán 4
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<HelpCircle className="w-4 h-4" />}
            onClick={() => onNavigate('teacher-question-bank')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Ngân hàng 8 dạng câu hỏi
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* CHUYỂN ĐỔI TAB: BÀI TẬP & BÁO CÁO TIẾN ĐỘ CHUYÊN MÔN */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ASSIGNMENTS'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Bài tập Đã phát hành ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('REPORT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'REPORT'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Báo cáo Tiến độ, Dạng lỗi & Học sinh cần hỗ trợ (Giai đoạn 7)
        </button>
      </div>

      {activeTab === 'REPORT' ? (
        <TeacherClassReportView classId={classId} />
      ) : (
        <>
          {/* DANH SÁCH BÀI TẬP ĐÃ GIAO CHO LỚP 4A */}
          <Card>
            <CardHeader
              title={`Bài tập đã phát hành cho ${classId} (${assignments.length} bài)`}
              subtitle="Chỉ nội dung bài học ĐÃ DUYỆT bởi CONTENT_REVIEWER mới được phát hành cho học sinh"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setAssignModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Giao bài tập
                </Button>
              }
            />

            <div className="pt-4">
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <Database className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Chưa có bài tập nào được giao cho lớp này.</p>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Hãy nhấn nút "Giao bài tập mới" để phát hành bài tập từ kho bài học đã được thẩm định.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map((asg) => (
                    <div
                      key={asg.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          ID: {asg.id}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Hạn nộp: {new Date(asg.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{asg.title}</h3>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {asg.instructions}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Đề bài: <strong>{asg.questionIds.length} câu hỏi</strong>
                        </span>

                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đang phát hành
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Ràng buộc Sư phạm và Danh sách học sinh mẫu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Quy trình Sư phạm EDUNOVA"
                subtitle="Ràng buộc chất lượng nội dung trước khi đến tay học sinh"
              />
              <div className="pt-3 space-y-2.5 text-xs text-slate-700">
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 space-y-1">
                  <span className="font-bold text-sky-900">1. Biên soạn & Thẩm định:</span>
                  <p className="text-slate-600">
                    Bài học được tạo ở trạng thái Chờ duyệt (PENDING_REVIEW). CONTENT_REVIEWER kiểm định cấu trúc 9 phần và chất lượng toán học.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 space-y-1">
                  <span className="font-bold text-emerald-900">2. Phát hành bài tập:</span>
                  <p className="text-slate-600">
                    Chỉ khi bài học đạt trạng thái ĐÃ DUYỆT (APPROVED), giáo viên mới có thể phát hành bài tập cho học sinh trong lớp.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 space-y-1">
                  <span className="font-bold text-amber-900">3. Chấm điểm quy tắc chuẩn xác:</span>
                  <p className="text-slate-600">
                    Học sinh nộp bài và nhận ngay kết quả chấm logic xác định 100%, bảo vệ tuyệt đối AnswerKeys và chống nộp trùng lặp.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Học sinh mẫu Lớp 4A"
                subtitle="Danh sách học sinh thử nghiệm trong môi trường phát triển"
              />
              <div className="pt-3 space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Trần Văn Nam (Mã: HS-4A-01)</p>
                    <p className="text-slate-500 text-[11px]">Email: student.nam@thalpha.edu.vn</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                    Đang hoạt động
                  </span>
                </div>

                <div className="p-3.5 bg-slate-100/60 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                  * DỮ LIỆU MẪU – KHÔNG PHẢI HỌC SINH THẬT. Tuân thủ Nguyên tắc 9 về bảo vệ quyền riêng tư và danh tính trẻ em.
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Modal giao bài tập */}
      <AssignHomeworkModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultClassId={classId}
        onSuccess={(asg) => {
          setSuccessMsg(`Đã giao thành công bài tập [${asg.title}] cho ${classId}!`);
          fetchAssignments();
        }}
      />
    </div>
  );
};
