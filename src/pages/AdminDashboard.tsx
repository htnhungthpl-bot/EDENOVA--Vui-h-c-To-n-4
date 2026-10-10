/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Table, Column } from '../components/ui/Table.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Spinner } from '../components/ui/Loading.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditLog } from '../types/auth.ts';
import { NavigationTarget } from '../types/index.ts';
import {
  Building2,
  Plus,
  ShieldCheck,
  Server,
  Lock,
  Unlock,
  Cpu,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Info,
  Bot,
  BarChart3,
} from 'lucide-react';
import { AiConfigDashboard } from '../components/admin/AiConfigDashboard.tsx';
import { SuperAdminSystemReportView } from '../components/reporting/SuperAdminSystemReportView.tsx';

export interface AdminDashboardProps {
  onNavigate?: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'schools' | 'ai-config' | 'audit' | 'system-report'>('schools');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [aiCosts, setAiCosts] = useState<any>(null);

  const [schools, setSchools] = useState<any[]>([]);
  const [schoolPagination, setSchoolPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isLockSchoolOpen, setIsLockSchoolOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  // Forms
  const [schoolForm, setSchoolForm] = useState({ code: '', name: '', address: '', contactEmail: '' });
  const [adminForm, setAdminForm] = useState({ email: '', name: '', password: '', schoolId: '' });
  const [lockReason, setLockReason] = useState('Tạm dừng để kiểm toán hồ sơ ban đầu');

  const fetchSchools = async (page = 1) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/admin/schools?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(data.items || []);
        setSchoolPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (err: unknown) {
      console.error('Lỗi nạp trường học:', err);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.items || data.logs || []);
        setLogPagination({
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || 0,
          totalPages: data.totalPages || 1,
        });
      }
    } catch (err: unknown) {
      console.error('Lỗi nạp Audit Logs:', err);
    }
  };

  const fetchAICosts = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/admin/ai-costs', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAiCosts(data.data);
      }
    } catch (err: unknown) {
      console.error('Lỗi nạp AI costs:', err);
    }
  };

  const refreshAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchSchools(1), fetchAuditLogs(1), fetchAICosts()]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshAll();
  }, [session]);

  // Hành động Tạo trường
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(schoolForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Đã tạo trường học [${data.school.name}] thành công.`);
        setIsCreateSchoolOpen(false);
        setSchoolForm({ code: '', name: '', address: '', contactEmail: '' });
        fetchSchools(schoolPagination.page);
        fetchAuditLogs(1);
      } else {
        setError(data.error || 'Lỗi tạo trường');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  // Hành động Tạo School Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await fetch('/api/admin/school-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Đã tạo tài khoản Quản trị viên cho trường thành công.`);
        setIsCreateAdminOpen(false);
        setAdminForm({ email: '', name: '', password: '', schoolId: '' });
        fetchAuditLogs(1);
      } else {
        setError(data.error || 'Lỗi tạo tài khoản quản trị trường');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  // Hành động Khóa/Mở khóa trường
  const handleToggleLock = async () => {
    if (!session || !selectedSchool) return;
    const newStatus = selectedSchool.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/schools/${selectedSchool.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: lockReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Đã chuyển trạng thái trường [${selectedSchool.name}] sang [${newStatus}].`);
        setIsLockSchoolOpen(false);
        fetchSchools(schoolPagination.page);
        fetchAuditLogs(1);
      } else {
        setError(data.error || 'Lỗi cập nhật trạng thái trường');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  const schoolColumns: Column<any>[] = [
    { key: 'code', header: 'Mã đơn vị' },
    { key: 'name', header: 'Tên trường học' },
    { key: 'address', header: 'Địa phương' },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (s) => (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            s.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {s.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedSchool(s);
              setIsLockSchoolOpen(true);
            }}
            className={`text-xs font-semibold underline cursor-pointer ${
              s.status === 'ACTIVE' ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'
            }`}
          >
            {s.status === 'ACTIVE' ? 'Khóa trường' : 'Mở khóa'}
          </button>
          <span>·</span>
          <button
            onClick={() => {
              setAdminForm((prev) => ({ ...prev, schoolId: s.id }));
              setIsCreateAdminOpen(true);
            }}
            className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline cursor-pointer"
          >
            Tạo School Admin
          </button>
        </div>
      ),
    },
  ];

  const logColumns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Thời gian',
      render: (log) => new Date(log.timestamp).toLocaleTimeString(),
    },
    { key: 'actorEmail', header: 'Tác nhân' },
    {
      key: 'actorRole',
      header: 'Vai trò',
      render: (log) => (
        <span className="font-semibold text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
          {log.actorRole}
        </span>
      ),
    },
    { key: 'action', header: 'Hành động' },
    {
      key: 'status',
      header: 'Kết quả',
      render: (log) => (
        <span
          className={`text-xs font-bold ${
            log.status === 'SUCCESS'
              ? 'text-emerald-600'
              : log.status === 'DENIED'
              ? 'text-rose-600'
              : 'text-amber-600'
          }`}
        >
          {log.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 to-[#0F294A] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 text-xs font-medium mb-2">
            <Building2 className="w-3.5 h-3.5 text-purple-300" />
            <span>Phân hệ Toàn Nền tảng (SUPER_ADMIN)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Trung tâm Điều hành Nền tảng EDUNOVA
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            Quản trị danh mục đơn vị trường học, chi phí mô hình AI, cấu hình hệ thống và kiểm toán bảo mật toàn diện.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={refreshAll}
            disabled={loading}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateSchoolOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Thêm trường học
          </Button>
        </div>
      </div>

      {/* Thông báo dữ liệu mẫu */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Thông báo dữ liệu phát triển:</strong> Danh sách trường học hiện tại được khởi tạo với nhãn <strong>[DỮ LIỆU MẪU – KHÔNG PHẢI TRƯỜNG THẬT]</strong> nhằm phục vụ mục đích kiểm thử và phát triển theo yêu cầu giai đoạn.
        </div>
      </div>

      {successMessage && (
        <Alert type="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert type="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* TAB SELECTOR */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('schools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'schools'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Quản lý Trường học & Tổ chức</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'ai-config'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Cấu hình Trợ giảng AI & Kiểm soát Chi phí (Giai đoạn 5)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Nhật ký Kiểm toán Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('system-report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'system-report'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Báo cáo Vận hành & Chi phí AI (Giai đoạn 7)</span>
        </button>
      </div>

      {activeTab === 'system-report' ? (
        <SuperAdminSystemReportView />
      ) : activeTab === 'ai-config' ? (
        <AiConfigDashboard />
      ) : activeTab === 'audit' ? (
        /* Bảng Audit Logs thời gian thực từ Backend */
        <Card>
          <CardHeader
            title="Nhật ký Quản trị & An ninh Hệ thống (Audit Logs)"
            subtitle="Truy xuất trực tiếp từ máy chủ backend qua /api/admin/audit-logs"
          />
          <div className="pt-4">
            <Table columns={logColumns} data={auditLogs} emptyMessage="Chưa có bản ghi nhật ký kiểm toán." />
            <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
              <span>Trang {logPagination.page} / {logPagination.totalPages} (Tổng {logPagination.total} bản ghi)</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logPagination.page <= 1}
                  onClick={() => fetchAuditLogs(logPagination.page - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logPagination.page >= logPagination.totalPages}
                  onClick={() => fetchAuditLogs(logPagination.page + 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* 3 Thẻ thống kê thời gian thực */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Chi phí & Quota AI</p>
                  <h4 className="text-sm font-bold text-slate-900">
                    {aiCosts ? aiCosts.costStatus : 'Chưa có dữ liệu'}
                  </h4>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 space-y-1">
                <div>Hạn mức còn lại: <strong>{aiCosts?.quotaRemaining || '100%'}</strong></div>
                <div>Gemini Flash RPM: <strong>{aiCosts?.rateLimits?.geminiFlashRpm || 15}</strong></div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Kiểm toán Audit Logs</p>
                  <h4 className="text-sm font-bold text-slate-900">
                    {logPagination.total} bản ghi ghi nhận
                  </h4>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                Tự động ghi vết mọi hành vi đăng nhập, truy cập trái phép và đổi vai trò.
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Đơn vị Trường học</p>
                  <h4 className="text-sm font-bold text-slate-900">
                    {schoolPagination.total} trường đã đăng ký
                  </h4>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                Áp dụng Tenant Isolation bảo mật cấp cơ sở dữ liệu.
              </p>
            </Card>
          </div>

          {/* Bảng danh sách trường học */}
          <Card>
            <CardHeader
              title="Danh mục đơn vị trường học liên kết"
              subtitle="Quản lý và thiết lập trạng thái hoạt động"
              action={
                <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCreateSchoolOpen(true)}>
                  Tạo trường mới
                </Button>
              }
            />
            <div className="pt-4">
              <Table columns={schoolColumns} data={schools} />
              <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
                <span>Trang {schoolPagination.page} / {schoolPagination.totalPages} (Tổng {schoolPagination.total} trường)</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={schoolPagination.page <= 1}
                    onClick={() => fetchSchools(schoolPagination.page - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={schoolPagination.page >= schoolPagination.totalPages}
                    onClick={() => fetchSchools(schoolPagination.page + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* MODAL 1: TẠO TRƯỜNG HỌC MỚI */}
      <Modal isOpen={isCreateSchoolOpen} onClose={() => setIsCreateSchoolOpen(false)} title="Thêm Đơn vị Trường học Mới">
        <form onSubmit={handleCreateSchool} className="space-y-3.5">
          <Input
            label="Mã trường (VD: TH-DELTA)"
            value={schoolForm.code}
            onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
            placeholder="TH-DELTA"
            required
          />
          <Input
            label="Tên trường học"
            value={schoolForm.name}
            onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
            placeholder="Trường Tiểu học Thực nghiệm Delta [DỮ LIỆU MẪU]"
            required
          />
          <Input
            label="Địa chỉ"
            value={schoolForm.address}
            onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
            placeholder="Cần Thơ"
            required
          />
          <Input
            label="Email liên hệ BGH"
            type="email"
            value={schoolForm.contactEmail}
            onChange={(e) => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })}
            placeholder="bgh@thdelta.edu.vn"
            required
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateSchoolOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận tạo trường
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TẠO TÀI KHOẢN SCHOOL_ADMIN */}
      <Modal isOpen={isCreateAdminOpen} onClose={() => setIsCreateAdminOpen(false)} title="Tạo Tài khoản Quản trị Trường (SCHOOL_ADMIN)">
        <form onSubmit={handleCreateAdmin} className="space-y-3.5">
          <Input
            label="ID Trường học"
            value={adminForm.schoolId}
            onChange={(e) => setAdminForm({ ...adminForm, schoolId: e.target.value })}
            placeholder="school_alpha"
            required
          />
          <Input
            label="Họ và tên Quản trị viên"
            value={adminForm.name}
            onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
            placeholder="Thầy Nguyễn Hoàng Nam"
            required
          />
          <Input
            label="Email tài khoản"
            type="email"
            value={adminForm.email}
            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            placeholder="admin.delta@thdelta.edu.vn"
            required
          />
          <Input
            label="Mật khẩu bảo mật (Tối thiểu 10 ký tự, có hoa, thường, số, ký tự đặc biệt)"
            type="password"
            value={adminForm.password}
            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            placeholder="AdminDeltaPassword@2026"
            required
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateAdminOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo tài khoản quản trị
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: KHÓA / MỞ KHÓA TRƯỜNG */}
      <Modal isOpen={isLockSchoolOpen} onClose={() => setIsLockSchoolOpen(false)} title="Thay đổi Trạng thái Trường học">
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            Bạn có chắc chắn muốn thay đổi trạng thái của trường <strong>[{selectedSchool?.name}]</strong> thành <strong>[{selectedSchool?.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'}]</strong>?
          </p>
          {selectedSchool?.status === 'ACTIVE' && (
            <Input
              label="Lý do khóa trường"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder="Nhập lý do khóa..."
            />
          )}
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsLockSchoolOpen(false)}>
              Hủy
            </Button>
            <Button
              variant={selectedSchool?.status === 'ACTIVE' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleToggleLock}
            >
              {selectedSchool?.status === 'ACTIVE' ? 'Xác nhận khóa trường' : 'Xác nhận mở khóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
