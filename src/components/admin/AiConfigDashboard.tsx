/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AiSystemConfig, AiUsageRecord } from '../../types/ai.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  Save,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const AiConfigDashboard: React.FC = () => {
  const { session } = useAuth();
  const [config, setConfig] = useState<AiSystemConfig>({
    isAiEnabled: true,
    dailyStudentQuota: 20,
    dailyTeacherQuota: 50,
    warningThresholdPercent: 80,
    modelName: 'gemini-3.8-flash',
    isConfigured: false,
  });

  const [records, setRecords] = useState<AiUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ tested: false });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [studentQuota, setStudentQuota] = useState(20);
  const [teacherQuota, setTeacherQuota] = useState(50);
  const [warningThreshold, setWarningThreshold] = useState(80);

  // Filter
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchData = async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const [configRes, recordsRes] = await Promise.all([
        fetch('/api/ai/admin/config', {
          headers: { Authorization: `Bearer ${session.token}` },
        }),
        fetch('/api/ai/admin/usage-records?limit=100', {
          headers: { Authorization: `Bearer ${session.token}` },
        }),
      ]);

      const configData = await configRes.json();
      const recordsData = await recordsRes.json();

      if (configData.success && configData.config) {
        setConfig(configData.config);
        setIsAiEnabled(configData.config.isAiEnabled);
        setStudentQuota(configData.config.dailyStudentQuota);
        setTeacherQuota(configData.config.dailyTeacherQuota);
        setWarningThreshold(configData.config.warningThresholdPercent);
      }

      if (recordsData.success && recordsData.records) {
        setRecords(recordsData.records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi nạp dữ liệu cấu hình AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleSaveConfig = async () => {
    if (!session?.token) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/ai/admin/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          isAiEnabled,
          dailyStudentQuota: Number(studentQuota),
          dailyTeacherQuota: Number(teacherQuota),
          warningThresholdPercent: Number(warningThreshold),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Đã cập nhật cấu hình Trợ giảng AI thành công.');
        setConfig(data.config);
      } else {
        setError(data.error || 'Lỗi khi lưu cấu hình.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!session?.token) return;
    setTesting(true);
    setHealthStatus({ tested: false });

    try {
      const res = await fetch('/api/ai/admin/test-connection', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const data = await res.json();
      setHealthStatus({
        tested: true,
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
      });
    } catch (err: unknown) {
      setHealthStatus({
        tested: true,
        success: false,
        message: err instanceof Error ? err.message : 'Lỗi kết nối.',
        latencyMs: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  // Metrics
  const totalCalls = records.length;
  const successCalls = records.filter((r) => r.status === 'SUCCESS').length;
  const rateLimitedCalls = records.filter((r) => r.status === 'RATE_LIMITED').length;
  const totalTokens = records.reduce((acc, r) => acc + (r.estimatedInputTokens + r.estimatedOutputTokens), 0);

  const filteredRecords = records.filter((r) => {
    if (filterRole !== 'ALL' && r.userRole !== filterRole) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            Quản trị Hệ thống • Giai đoạn 5
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Cấu hình Trợ giảng Sư phạm & Kiểm soát Chi phí AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Quản lý tích hợp Gemini API tầng backend, kiểm soát hạn mức lượt hỏi, công tắc an toàn toàn hệ thống và giám sát nhật ký AIUsageRecords (tuân thủ bảo vệ quyền riêng tư học sinh).
        </p>
      </div>

      {message && <Alert type="success" onDismiss={() => setMessage(null)}>{message}</Alert>}
      {error && <Alert type="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* 4 Thẻ chỉ số tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng lượt gọi AI</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {totalCalls}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Từ các phiên làm việc</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tỷ lệ thành công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{successCalls} lượt thành công</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Chặn vượt hạn mức</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
            {rateLimitedCalls}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lượt chặn 429 bảo vệ ngân sách</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ước tính Token</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 font-mono">
            {totalTokens.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tokens vào/ra hệ thống</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT 1 & 2: BẢNG ĐIỀU KHIỂN & CẤU HÌNH */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Thiết lập Hạn mức & Kiểm soát Chi phí
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Mô hình: <strong className="text-slate-800 font-mono">{config.modelName}</strong>
              </span>
            </div>

            {/* Công tắc toàn cục */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Công tắc ngắt toàn cục (Global Kill-Switch)</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isAiEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isAiEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </span>
                </label>
                <p className="text-xs text-slate-500">
                  Khi tắt, mọi yêu cầu gọi AI sẽ bị từ chối ngay lập tức ở tầng backend kèm thông báo thân thiện.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAiEnabled(!isAiEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  isAiEnabled ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Các trường cấu hình hạn mức */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Hạn mức Học sinh / ngày:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={studentQuota}
                    onChange={(e) => setStudentQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400">lượt</span>
                </div>
                <p className="text-[10px] text-slate-400">Mặc định: 20 lượt/ngày</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Hạn mức Giáo viên / ngày:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={teacherQuota}
                    onChange={(e) => setTeacherQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400">lượt</span>
                </div>
                <p className="text-[10px] text-slate-400">Mặc định: 50 lượt/ngày</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Ngưỡng cảnh báo chi phí (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400">Mặc định: 80% hạn mức</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConfig}
                disabled={saving}
                icon={<Save className="w-4 h-4" />}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {saving ? 'Đang lưu...' : 'Lưu cấu hình hệ thống'}
              </Button>
            </div>
          </Card>
        </div>

        {/* CỘT 3: TRẠNG THÁI TÍCH HỢP GEMINI API */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border-slate-200 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Activity className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Trạng thái Gemini API Backend
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Khóa GEMINI_API_KEY:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    config.isConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {config.isConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Mô hình AI:</span>
                <span className="font-mono font-bold text-slate-800">
                  {config.modelName}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Thư viện SDK:</span>
                <span className="font-mono text-slate-700">
                  @google/genai ^2.4.0
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Bảo mật khóa:</span>
                <span className="font-semibold text-emerald-700">
                  100% Server-side (Ẩn với client)
                </span>
              </div>
            </div>

            {/* Nút Health-check */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />}
                className="w-full text-xs font-semibold"
              >
                {testing ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối Gemini API (Health Check)'}
              </Button>
            </div>

            {healthStatus.tested && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  healthStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {healthStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{healthStatus.success ? 'Kết nối thành công!' : 'Kết nối thất bại'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{healthStatus.message}</p>
                {healthStatus.latencyMs !== undefined && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Độ trễ: {healthStatus.latencyMs}ms
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* BẢNG NHẬT KÝ SỬ DỤNG AIUSAGERECORDS */}
      <Card className="p-6 bg-white border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Nhật ký Sử dụng AIUsageRecords</span>
              <span className="text-xs font-normal text-slate-500">
                (Tổng số: {records.length} bản ghi)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Chỉ lưu vết tối thiểu theo nguyên tắc bảo vệ quyền riêng tư: Tuyệt đối không lưu tên hoặc PII học sinh trong prompt log.
            </p>
          </div>

          {/* Bộ lọc */}
          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Học sinh (STUDENT)</option>
              <option value="TEACHER">Giáo viên (TEACHER)</option>
              <option value="SUPER_ADMIN">Quản trị viên (SUPER_ADMIN)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">SUCCESS (Thành công)</option>
              <option value="RATE_LIMITED">RATE_LIMITED (Hết hạn mức)</option>
              <option value="DISABLED">DISABLED (AI tạm ngưng)</option>
              <option value="ERROR">ERROR (Lỗi/Timeout)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              icon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
              className="text-xs"
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Mã người dùng (Ẩn danh)</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3">Bài học</th>
                <th className="p-3">Loại yêu cầu</th>
                <th className="p-3">Tokens (Vào / Ra)</th>
                <th className="p-3">Độ trễ</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleTimeString('vi-VN')} {new Date(r.timestamp).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {r.userId}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {r.userRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sky-700 font-medium">
                      {r.lessonId}
                    </td>
                    <td className="p-3 text-[11px]">
                      {r.requestType}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {r.estimatedInputTokens} / {r.estimatedOutputTokens}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {r.latencyMs}ms
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'RATE_LIMITED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    Chưa có bản ghi nhật ký sử dụng AI nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
