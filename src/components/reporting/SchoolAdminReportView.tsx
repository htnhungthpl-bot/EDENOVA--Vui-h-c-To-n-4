/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { SchoolReportData } from '../../types/reporting.ts';
import {
  Building2,
  Download,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  RotateCcw,
  BarChart2,
  FileSpreadsheet,
} from 'lucide-react';

export interface SchoolAdminReportViewProps {
  schoolId: string;
}

export const SchoolAdminReportView: React.FC<SchoolAdminReportViewProps> = ({ schoolId }) => {
  const { session } = useAuth();
  const [report, setReport] = useState<SchoolReportData | null>(null);
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
      const res = await fetch(`/api/reports/school/${schoolId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'Không thể tải báo cáo của trường.');
      }
    } catch (err) {
      console.error('Lỗi tải báo cáo trường:', err);
      setError('Lỗi kết nối khi tải báo cáo trường.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchReport();
    }
  }, [schoolId, session]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`/api/reports/school/${schoolId}/export-csv`, { headers });
      if (!res.ok) {
        alert('Không thể xuất báo cáo trường ra CSV. Vui lòng kiểm tra quyền.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-truong-${schoolId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Lỗi xuất CSV trường:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center text-xs text-slate-500 space-y-2">
        <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Đang tổng hợp dữ liệu báo cáo toàn trường...</p>
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
        <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">
          {report?.statusMessage || 'Chưa có dữ liệu bài làm trong toàn trường'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Hiện tại các lớp trong trường chưa có dữ liệu nộp bài thực tế. Báo cáo sẽ tự động tổng hợp khi giáo viên giao bài và học sinh hoàn thành bài làm.
        </p>
        <Button variant="outline" size="sm" onClick={fetchReport} icon={<RotateCcw className="w-3.5 h-3.5" />}>
          Kiểm tra lại
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Trường */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F294A] to-sky-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-sky-200">
              Báo cáo Quản lý Nhà trường (SCHOOL_ADMIN)
            </span>
            <span className="text-xs text-slate-300">Mã trường: {report.schoolId}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {report.schoolName}
          </h2>
          <p className="text-xs text-slate-200 mt-0.5">
            Tổng hợp dữ liệu trong phạm vi trường, theo dõi kết quả triển khai GDPT 2018 Toán 4.
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
            {exporting ? 'Đang xuất...' : 'Xuất Báo cáo Trường (CSV)'}
          </Button>
        </div>
      </div>

      {/* Chỉ số toàn trường */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Quy mô Nhà trường</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{report.totalClasses} <span className="text-xs font-normal">lớp</span></div>
          <div className="text-[11px] text-slate-400 mt-0.5">{report.totalTeachers} giáo viên • {report.totalStudents} học sinh</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Bài tập phát hành</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{report.totalAssignments}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Trên toàn bộ các lớp</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Tổng lượt nộp bài</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{report.totalSubmissions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tỷ lệ nộp TB: {report.schoolCompletionRate}%</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Độ chính xác TB Toàn trường</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{report.schoolAverageAccuracy}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tính theo các bài nộp thực tế</div>
        </div>
      </div>

      {/* Bảng tổng hợp theo từng lớp */}
      <Card>
        <CardHeader
          title="Tình hình học tập theo từng lớp học"
          subtitle="Theo dõi tiến độ hoàn thành và độ chính xác của các lớp (Không xếp hạng cá nhân học sinh)"
        />
        <div className="p-5 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Lớp học</th>
                  <th className="p-3 text-center">Số học sinh</th>
                  <th className="p-3 text-center">Số bài tập giao</th>
                  <th className="p-3 text-center">Số bài đã nộp</th>
                  <th className="p-3 text-center">Tỷ lệ nộp bài</th>
                  <th className="p-3 text-center">Độ chính xác TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.classSummaries.map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{cls.className}</div>
                      <div className="text-[11px] font-mono text-slate-400">{cls.classId}</div>
                    </td>
                    <td className="p-3 text-center font-mono">{cls.studentCount}</td>
                    <td className="p-3 text-center font-mono">{cls.assignmentCount}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800">{cls.submissionCount}</td>
                    <td className="p-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cls.completionRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cls.completionRate}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-sky-700">
                      {cls.averageAccuracy}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Hoạt động của giáo viên */}
      <Card>
        <CardHeader
          title="Tình hình hoạt động chuyên môn của giáo viên"
          subtitle="Số lượng bài tập phát hành từ kho bài học đã duyệt và các lớp phụ trách"
        />
        <div className="p-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {report.teacherActivity.map((tc) => (
              <div key={tc.teacherId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-xs text-slate-900">{tc.teacherName}</div>
                <div className="text-[11px] text-slate-500">
                  Lớp phụ trách: <span className="font-medium text-slate-700">{tc.classesAssigned.join(', ') || 'Chưa phân công'}</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  Đã phát hành: {tc.assignmentsCreated} bài tập
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
