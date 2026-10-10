/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { SuperAdminDashboardReport } from '../../types/reporting.ts';
import {
  ShieldAlert,
  Server,
  Cpu,
  DollarSign,
  Activity,
  Users,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Database,
  Calculator,
} from 'lucide-react';

export const SuperAdminSystemReportView: React.FC = () => {
  const { session } = useAuth();
  const [report, setReport] = useState<SuperAdminDashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phân trang Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

  // Modal điều chỉnh đơn giá AI
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [inputPrice, setInputPrice] = useState(0.075);
  const [outputPrice, setOutputPrice] = useState(0.3);
  const [exchangeRate, setExchangeRate] = useState(25400);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch('/api/reports/admin/overview', { headers });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setInputPrice(data.report.aiUsageAndCost.pricingConfig.inputTokenPricePerMillionUsd);
        setOutputPrice(data.report.aiUsageAndCost.pricingConfig.outputTokenPricePerMillionUsd);
        setExchangeRate(data.report.aiUsageAndCost.pricingConfig.exchangeRateUsdToVnd);
      } else {
        setError(data.error || 'Lỗi tải báo cáo tổng quan.');
      }
    } catch (err) {
      console.error('Lỗi tải báo cáo SuperAdmin:', err);
      setError('Lỗi kết nối khi tải báo cáo quản trị.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (targetPage: number) => {
    setAuditLoading(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`/api/reports/admin/audit-logs?page=${targetPage}&limit=10`, { headers });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.totalItems || 0);
      }
    } catch (err) {
      console.error('Lỗi tải audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchAuditLogs(1);
  }, [session]);

  const handleSavePricing = async () => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch('/api/reports/admin/ai-pricing', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputTokenPricePerMillionUsd: Number(inputPrice),
          outputTokenPricePerMillionUsd: Number(outputPrice),
          exchangeRateUsdToVnd: Number(exchangeRate),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchOverview();
        setPricingModalOpen(false);
      }
    } catch (err) {
      console.error('Lỗi lưu đơn giá AI:', err);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center text-xs text-slate-500 space-y-2">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Đang tải báo cáo tình trạng toàn hệ thống...</p>
      </Card>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
        <span>{error || 'Chưa có dữ liệu'}</span>
        <Button variant="outline" size="sm" onClick={fetchOverview}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. BANNER QUẢN TRỊ TỔNG */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F294A] via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-indigo-200">
              Báo cáo Vận hành Nền tảng (SUPER_ADMIN)
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Hệ thống sẵn sàng
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Giám sát Tài nguyên, Dịch vụ & Chi phí AI EDUNOVA
          </h2>
          <p className="text-xs text-slate-200 mt-0.5">
            Tổng hợp dữ liệu thời gian thực: tài khoản hoạt động, dịch vụ nền tảng, token tiêu thụ và nhật ký bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchOverview();
              fetchAuditLogs(page);
            }}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
          >
            Làm mới
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => setPricingModalOpen(true)}
            icon={<Settings2 className="w-3.5 h-3.5" />}
            className="bg-indigo-400 hover:bg-indigo-500 text-slate-900 font-bold text-xs"
          >
            Cấu hình Đơn giá AI
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã cập nhật công thức và đơn giá tính toán chi phí AI thành công.</span>
        </div>
      )}

      {/* 2. CHỈ SỐ TÀI KHOẢN ĐANG HOẠT ĐỘNG */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">SUPER_ADMIN</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {report.activeAccounts.byRole.SUPER_ADMIN}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">Tổng Quản trị</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">SCHOOL_ADMIN</div>
          <div className="text-xl font-black text-sky-700 mt-0.5">
            {report.activeAccounts.byRole.SCHOOL_ADMIN}
          </div>
          <div className="text-[10px] text-slate-400">Quản trị Trường</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">GIÁO VIÊN</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">
            {report.activeAccounts.byRole.TEACHER}
          </div>
          <div className="text-[10px] text-slate-400">Đang hoạt động</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">HỌC SINH</div>
          <div className="text-xl font-black text-amber-600 mt-0.5">
            {report.activeAccounts.byRole.STUDENT}
          </div>
          <div className="text-[10px] text-slate-400">Lớp Toán 4</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">THẨM ĐỊNH VIÊN</div>
          <div className="text-xl font-black text-purple-700 mt-0.5">
            {report.activeAccounts.byRole.CONTENT_REVIEWER}
          </div>
          <div className="text-[10px] text-slate-400">Duyệt bài học</div>
        </div>
      </div>

      {/* 3. TRẠNG THÁI DỊCH VỤ NỀN TẢNG (SERVICE HEALTH) */}
      <Card>
        <CardHeader
          title="Trạng thái dịch vụ nền tảng (Service Health Status)"
          subtitle="Giám sát tính sẵn sàng, thời gian hoạt động và độ trễ phản hồi của các thành phần hệ thống"
        />
        <div className="p-5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.serviceHealth.map((sv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-xs text-slate-900">{sv.serviceName}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">{sv.details}</p>
                  <div className="text-[11px] text-slate-400">
                    Độ trễ: <strong className="text-slate-700 font-mono">{sv.latencyMs}ms</strong> • Uptime: <strong className="text-emerald-700">{sv.uptimePercentage}%</strong>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  sv.status === 'HEALTHY'
                    ? 'bg-emerald-100 text-emerald-800'
                    : sv.status === 'DEGRADED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {sv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. BÁO CÁO CHI PHÍ VÀ LƯỢT GỌI AI (KÈM CÔNG THỨC MINH BẠCH) */}
      <Card className="border-indigo-200 bg-indigo-50/20">
        <CardHeader
          title="Báo cáo Lượt gọi AI & Chi phí Ước tính (Gemini API)"
          subtitle="Công thức tính toán minh bạch với đơn giá cấu hình được"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPricingModalOpen(true)}
              icon={<Calculator className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Xem / Sửa công thức
            </Button>
          }
        />
        <div className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[11px] text-slate-500 font-medium">Lượt gọi AI</div>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {report.aiUsageAndCost.totalCalls}
              </div>
              <div className="text-[10px] text-slate-400">
                {report.aiUsageAndCost.successfulCalls} thành công • {report.aiUsageAndCost.failedCalls} lỗi
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[11px] text-slate-500 font-medium">Input Tokens</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {report.aiUsageAndCost.totalInputTokens.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Tokens gửi vào model</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[11px] text-slate-500 font-medium">Output Tokens</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {report.aiUsageAndCost.totalOutputTokens.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Tokens model sinh ra</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-indigo-100">
              <div className="text-[11px] text-slate-500 font-medium">Chi phí ước tính</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                ${report.aiUsageAndCost.estimatedCostUsd} <span className="text-xs font-normal">USD</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">
                ≈ {report.aiUsageAndCost.estimatedCostVnd.toLocaleString('vi-VN')} VND
              </div>
            </div>
          </div>

          {/* Công thức tính toán chi phí minh bạch */}
          <div className="p-3.5 rounded-xl bg-white border border-indigo-200 text-xs text-indigo-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Công thức tính chi phí hiện hành:
            </div>
            <div className="font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {report.aiUsageAndCost.costFormula}
            </div>
            <div className="text-[11px] text-slate-500">
              Đơn giá cấu hình: Input: ${report.aiUsageAndCost.pricingConfig.inputTokenPricePerMillionUsd}/1M tokens • Output: ${report.aiUsageAndCost.pricingConfig.outputTokenPricePerMillionUsd}/1M tokens • Tỷ giá: {report.aiUsageAndCost.pricingConfig.exchangeRateUsdToVnd.toLocaleString('vi-VN')} VND/USD.
            </div>
          </div>
        </div>
      </Card>

      {/* 5. LỖI HỆ THỐNG (SYSTEM ERRORS) */}
      <Card>
        <CardHeader
          title="Thống kê lỗi hệ thống (System Errors)"
          subtitle="Tổng hợp các lỗi phát sinh trong quá trình vận hành từ Audit Logs"
        />
        <div className="p-5 pt-0 space-y-3">
          {report.systemErrors.totalErrorsRecorded === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
              ✅ Hệ thống hoạt động hoàn hảo, chưa ghi nhận lỗi thao tác nghiêm trọng nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Hành động</th>
                    <th className="p-3">Người dùng</th>
                    <th className="p-3">Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.systemErrors.recentErrorLogs.map((err, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/20">
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(err.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{err.action}</td>
                      <td className="p-3 text-slate-600">{err.actorEmail}</td>
                      <td className="p-3 text-rose-700 font-medium">{err.errorMessage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 6. NHẬT KÝ THAO TÁC QUAN TRỌNG CÓ PHÂN TRANG (AUDIT LOGS) */}
      <Card>
        <CardHeader
          title="Nhật ký thao tác quan trọng (Audit Logs)"
          subtitle={`Ghi nhận mọi hành động nhạy cảm trong hệ thống (Tổng số ${totalItems} bản ghi)`}
        />
        <div className="p-5 pt-0 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Người thực hiện</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">Đối tượng</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.actorEmail}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang chuẩn */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div>
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Hiển thị {auditLogs.length} bản ghi)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || auditLoading}
                onClick={() => fetchAuditLogs(page - 1)}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || auditLoading}
                onClick={() => fetchAuditLogs(page + 1)}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* MODAL CẤU HÌNH ĐƠN GIÁ AI */}
      {pricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-600" />
                Cấu hình Đơn giá & Tỷ giá Chi phí AI
              </h3>
              <button
                onClick={() => setPricingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Đơn giá Input Tokens ($ / 1.000.000 tokens):
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={inputPrice}
                  onChange={(e) => setInputPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Đơn giá Output Tokens ($ / 1.000.000 tokens):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={outputPrice}
                  onChange={(e) => setOutputPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tỷ giá quy đổi (VND / 1 USD):
                </label>
                <input
                  type="number"
                  step="100"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseInt(e.target.value, 10) || 25400)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPricingModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePricing} className="bg-indigo-600 text-white font-bold">
                Lưu cấu hình
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
