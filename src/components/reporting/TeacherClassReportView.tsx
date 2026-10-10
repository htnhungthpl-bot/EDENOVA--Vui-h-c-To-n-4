/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ClassReportData } from '../../types/reporting.ts';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  TrendingUp,
  BarChart2,
  BookOpen,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  Info,
} from 'lucide-react';

export interface TeacherClassReportViewProps {
  classId: string;
}

export const TeacherClassReportView: React.FC<TeacherClassReportViewProps> = ({ classId }) => {
  const { session } = useAuth();
  const [report, setReport] = useState<ClassReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`/api/reports/class/${classId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'Không thể tải báo cáo của lớp.');
      }
    } catch (err: unknown) {
      console.error('Lỗi tải báo cáo:', err);
      setError('Lỗi kết nối khi tải báo cáo lớp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchReport();
    }
  }, [classId, session]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`/api/reports/class/${classId}/export-csv`, { headers });
      if (!res.ok) {
        alert('Không thể xuất dữ liệu CSV. Vui lòng kiểm tra quyền truy cập.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-lop-${classId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Lỗi xuất CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center text-xs text-slate-500 space-y-2">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Đang tổng hợp báo cáo học tập và phân tích lớp học...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={fetchReport}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!report || !report.hasData) {
    return (
      <Card className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <FileText className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">
          {report?.statusMessage || 'Chưa có dữ liệu bài làm của học sinh trong lớp'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Số liệu báo cáo chỉ được tính toán dựa trên dữ liệu nộp bài thực tế. Khi học sinh hoàn thành các bài tập được giao, hệ thống sẽ tự động cập nhật bảng phân tích tỷ lệ đúng, dạng lỗi và danh sách học sinh cần hỗ trợ.
        </p>
        <Button variant="outline" size="sm" onClick={fetchReport} icon={<RotateCcw className="w-3.5 h-3.5" />}>
          Kiểm tra lại dữ liệu
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. THANH TỔNG HỢP VÀ NÚT XUẤT CSV */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-[#0F294A] text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-emerald-200">
              Báo cáo Chuyên môn • {report.className}
            </span>
            <span className="text-xs text-slate-300">Mã lớp: {report.classId}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Báo cáo Tiến độ & Kết quả Học tập Lớp học
          </h2>
          <p className="text-xs text-slate-200 mt-0.5">
            Tổng hợp dữ liệu bài tập, phân tích lỗi sai và nhận diện học sinh cần hỗ trợ sư phạm.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
          >
            Làm mới
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
            icon={<Download className="w-3.5 h-3.5" />}
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs shadow-sm"
          >
            {exporting ? 'Đang xuất CSV...' : 'Xuất Báo cáo CSV'}
          </Button>
        </div>
      </div>

      {/* 2. CHỈ SỐ THEN CHỐT CỦA LỚP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Học sinh trong lớp</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{report.totalStudents}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Học sinh được giao bài</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Bài tập phát hành</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{report.totalAssignments}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Từ học liệu đã duyệt</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Lượt hoàn thành</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{report.totalSubmissions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bài nộp đã chấm quy tắc</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Độ chính xác TB Lớp</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{report.overallClassAccuracy}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Qua các bài nộp thực tế</div>
        </div>
      </div>

      {/* 3. DANH SÁCH HỌC SINH CẦN HỖ TRỢ SƯ PHẠM (TIÊU CHÍ MINH BẠCH) */}
      <Card className="border-amber-300 bg-amber-50/20">
        <CardHeader
          title={`Danh sách học sinh cần hỗ trợ sư phạm (${report.studentsNeedingSupport.length} em)`}
          subtitle="Hệ thống sàng lọc theo tiêu chí sư phạm rõ ràng, minh bạch giúp thầy cô can thiệp kịp thời"
        />
        <div className="p-5 pt-0 space-y-3">
          {/* Hộp giải thích tiêu chí minh bạch */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Tiêu chí xác định học sinh cần hỗ trợ:</strong>
              <span className="block mt-0.5 text-amber-800">
                {report.supportCriteriaExplanation}
              </span>
            </div>
          </div>

          {report.studentsNeedingSupport.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
              🎉 100% học sinh trong lớp hiện đang đạt tiến độ tốt, không có em nào dưới ngưỡng hỗ trợ.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Tiêu chí kích hoạt</th>
                    <th className="p-3 text-center">Độ chính xác gần nhất</th>
                    <th className="p-3">Dạng lỗi chính</th>
                    <th className="p-3">Khuyến nghị sư phạm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.studentsNeedingSupport.map((st) => (
                    <tr key={st.studentId} className="hover:bg-amber-50/30">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{st.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{st.studentId}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          {st.triggerCriteria}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {st.recentAccuracy}%
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-800">
                          {st.primaryErrorLabel || 'Chưa xác định'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs leading-relaxed">
                        {st.suggestedAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 4. KẾT QUẢ TỪNG BÀI TẬP ĐÃ GIAO */}
      <Card>
        <CardHeader
          title="Kết quả chi tiết từng bài tập"
          subtitle="Số học sinh hoàn thành, điểm trung bình và khoảng phân tán điểm số"
        />
        <div className="p-5 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Bài tập</th>
                  <th className="p-3">Hạn nộp</th>
                  <th className="p-3 text-center">Đã nộp / Giao</th>
                  <th className="p-3 text-center">Tỷ lệ nộp</th>
                  <th className="p-3 text-center">Điểm TB</th>
                  <th className="p-3 text-center">Độ chính xác TB</th>
                  <th className="p-3 text-center">Khoảng chính xác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.assignmentSummaries.map((asg) => (
                  <tr key={asg.assignmentId} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{asg.title}</div>
                      <div className="text-[11px] text-slate-400">{asg.lessonTitle}</div>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(asg.deadline).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      {asg.completedCount} / {asg.assignedCount}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        asg.completionRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {asg.completionRate}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800">
                      {asg.averageScore}/{asg.maxScore}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-sky-700">
                      {asg.averageAccuracy}%
                    </td>
                    <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                      {asg.lowestAccuracy}% – {asg.highestAccuracy}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* 5. PHÂN TÍCH TỶ LỆ ĐÚNG THEO CÂU VÀ DẠNG LỖI SAI PHỔ BIẾN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tỷ lệ đúng theo câu */}
        <Card>
          <CardHeader
            title="Tỷ lệ đúng theo từng câu hỏi"
            subtitle="Phát hiện các câu hỏi học sinh gặp nhiều khó khăn để giảng lại trên lớp"
          />
          <div className="p-5 pt-0 space-y-3">
            {report.questionAccuracyBreakdown.map((q) => (
              <div
                key={q.questionId}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 line-clamp-1">{q.questionPrompt}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    q.accuracyPercentage >= 70
                      ? 'bg-emerald-100 text-emerald-800'
                      : q.accuracyPercentage >= 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {q.accuracyPercentage}% Đúng ({q.correctAttempts}/{q.totalAttempts})
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      q.accuracyPercentage >= 70 ? 'bg-emerald-500' : q.accuracyPercentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${q.accuracyPercentage}%` }}
                  />
                </div>
                {q.commonWrongAnswer && (
                  <div className="text-[11px] text-slate-500 italic">
                    Đáp án sai thường gặp: "{q.commonWrongAnswer}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Dạng lỗi phổ biến */}
        <Card>
          <CardHeader
            title="Dạng lỗi phổ biến toàn lớp"
            subtitle="Phân loại theo chuẩn sư phạm giúp định hướng bài giảng tiếp theo"
          />
          <div className="p-5 pt-0 space-y-3">
            {report.commonErrorPatterns.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
                Chưa ghi nhận lỗi sai phổ biến nào.
              </div>
            ) : (
              report.commonErrorPatterns.map((err) => (
                <div
                  key={err.errorTag}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{err.errorLabel}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      Gặp {err.count} lần ({err.percentage}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {err.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
