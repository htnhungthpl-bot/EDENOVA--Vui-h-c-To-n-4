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
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Spinner } from '../components/ui/Loading.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SchoolAdminReportView } from '../components/reporting/SchoolAdminReportView.tsx';
import {
  Building2,
  Users,
  Plus,
  BookOpen,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  BarChart3,
} from 'lucide-react';

export const SchoolAdminDashboard: React.FC = () => {
  const { session } = useAuth();
  const schoolId = session?.schoolId || 'school_alpha';

  const [activeTab, setActiveTab] = useState<'classes' | 'teachers' | 'students' | 'report'>('classes');

  // Dữ liệu Lớp học
  const [classes, setClasses] = useState<any[]>([]);
  const [classPagination, setClassPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Dữ liệu Giáo viên
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherPagination, setTeacherPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });

  // Dữ liệu Học sinh trong lớp
  const [students, setStudents] = useState<any[]>([]);
  const [studentPagination, setStudentPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });

  // Trạng thái tải & lỗi
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Form states
  const [classForm, setClassForm] = useState({ code: '', name: '', gradeLevel: 4, academicYear: '2026-2027' });
  const [assignForm, setAssignForm] = useState({ teacherId: '' });
  const [studentForm, setStudentForm] = useState({ studentCode: '', displayName: '' });

  // 1. Nạp danh sách lớp học
  const fetchClasses = async (page = 1) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setClasses(data.items || []);
        setClassPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
        if (data.items?.length > 0 && !selectedClassId) {
          setSelectedClassId(data.items[0].id);
        }
      } else {
        setError(data.error || 'Lỗi tải danh sách lớp');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // 2. Nạp danh sách giáo viên
  const fetchTeachers = async (page = 1) => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/teachers?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.items || []);
        setTeacherPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi nạp giáo viên');
    } finally {
      setLoading(false);
    }
  };

  // 3. Nạp danh sách học sinh theo lớp
  const fetchStudents = async (classId: string, page = 1) => {
    if (!session || !classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes/${classId}/students?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.items || []);
        setStudentPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi nạp học sinh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses(1);
    fetchTeachers(1);
  }, [session, schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId, 1);
    }
  }, [selectedClassId]);

  // Hành động Tạo lớp học
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(classForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Đã tạo lớp [${data.class.name}] thành công.`);
        setIsCreateClassOpen(false);
        setClassForm({ code: '', name: '', gradeLevel: 4, academicYear: '2026-2027' });
        fetchClasses(classPagination.page);
      } else {
        setError(data.error || 'Lỗi tạo lớp học');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  // Hành động Phân công giáo viên
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedClassId) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes/${selectedClassId}/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setIsAssignTeacherOpen(false);
        setAssignForm({ teacherId: '' });
        fetchClasses(classPagination.page);
      } else {
        setError(data.error || 'Lỗi phân công');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  // Hành động Thêm học sinh
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedClassId) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes/${selectedClassId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setIsAddStudentOpen(false);
        setStudentForm({ studentCode: '', displayName: '' });
        fetchStudents(selectedClassId, studentPagination.page);
      } else {
        setError(data.error || 'Lỗi thêm học sinh');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  const classColumns: Column<any>[] = [
    { key: 'code', header: 'Mã lớp' },
    { key: 'name', header: 'Tên lớp' },
    { key: 'gradeLevel', header: 'Khối', render: (c) => `Khối ${c.gradeLevel}` },
    { key: 'academicYear', header: 'Năm học' },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (c) => (
        <button
          onClick={() => {
            setSelectedClassId(c.id);
            setActiveTab('students');
          }}
          className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer"
        >
          Xem học sinh
        </button>
      ),
    },
  ];

  const teacherColumns: Column<any>[] = [
    { key: 'name', header: 'Họ và tên giáo viên' },
    { key: 'email', header: 'Email tài khoản' },
    {
      key: 'assignedClassIds',
      header: 'Lớp phân công',
      render: (t) =>
        t.assignedClassIds?.length > 0
          ? t.assignedClassIds.join(', ')
          : <span className="text-slate-400 italic">Chưa phân công</span>,
    },
  ];

  const studentColumns: Column<any>[] = [
    { key: 'studentCode', header: 'Mã học sinh ẩn danh' },
    {
      key: 'displayName',
      header: 'Tên hiển thị / Biệt danh',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span>{s.displayName}</span>
          {s.isSampleData && (
            <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
              DỮ LIỆU MẪU
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'joinedAt',
      header: 'Thời điểm ghi danh',
      render: (s) => new Date(s.joinedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950 to-[#0F294A] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-200 text-xs font-medium mb-2">
            <Building2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Phân hệ Quản trị Trường học (SCHOOL_ADMIN)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Quản lý Tổ chức & Phân công Lớp học
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            Quản lý giáo viên, lớp học và ghi danh học sinh trong phạm vi đơn vị trường [<strong>{schoolId}</strong>]. Dữ liệu được bảo vệ nghiêm ngặt bằng cơ chế Tenant Isolation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateClassOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Tạo lớp mới
          </Button>
        </div>
      </div>

      {/* Thông báo dữ liệu mẫu bắt buộc theo Yêu cầu 8 */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Lưu ý về dữ liệu:</strong> Toàn bộ hồ sơ học sinh và lớp học trong hệ thống hiện tại là <strong>DỮ LIỆU MẪU – KHÔNG PHẢI HỌC SINH THẬT</strong> phục vụ kiểm thử và phát triển. Hệ thống tuân thủ nghiêm ngặt Nguyên tắc 9: Chỉ lưu trữ mã ẩn danh và biệt danh thay vì dữ liệu định danh của trẻ em.
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'classes' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Danh sách Lớp học ({classPagination.total})
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'teachers' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Giáo viên bộ môn ({teacherPagination.total})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'students' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Học sinh theo lớp ({studentPagination.total})
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'report' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Báo cáo Trường (Giai đoạn 7)
        </button>
      </div>

      {/* TAB 4: BÁO CÁO TRƯỜNG */}
      {activeTab === 'report' && (
        <SchoolAdminReportView schoolId={schoolId} />
      )}

      {/* TAB 1: LỚP HỌC */}
      {activeTab === 'classes' && (
        <Card>
          <CardHeader
            title="Danh sách Lớp học"
            subtitle={`Đơn vị trường [${schoolId}]`}
            action={
              <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCreateClassOpen(true)}>
                Thêm lớp mới
              </Button>
            }
          />
          <div className="pt-4">
            {loading ? (
              <div className="py-8 text-center"><Spinner /></div>
            ) : classes.length === 0 ? (
              <EmptyState title="Chưa có dữ liệu lớp học" description="Trường chưa có lớp học nào. Hãy tạo lớp học mới." />
            ) : (
              <>
                <Table columns={classColumns} data={classes} />
                <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
                  <span>Trang {classPagination.page} / {classPagination.totalPages} (Tổng {classPagination.total} lớp)</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={classPagination.page <= 1}
                      onClick={() => fetchClasses(classPagination.page - 1)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={classPagination.page >= classPagination.totalPages}
                      onClick={() => fetchClasses(classPagination.page + 1)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* TAB 2: GIÁO VIÊN */}
      {activeTab === 'teachers' && (
        <Card>
          <CardHeader
            title="Đội ngũ Giáo viên bộ môn"
            subtitle={`Phụ trách giảng dạy tại trường [${schoolId}]`}
          />
          <div className="pt-4">
            <Table columns={teacherColumns} data={teachers} emptyMessage="Chưa có dữ liệu giáo viên trong trường." />
          </div>
        </Card>
      )}

      {/* TAB 3: HỌC SINH THEO LỚP */}
      {activeTab === 'students' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Danh sách Học sinh trong Lớp</h3>
              <p className="text-xs text-slate-500">Mã định danh ẩn danh và biệt danh</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-900"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                icon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => setIsAssignTeacherOpen(true)}
              >
                Phân công GV
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddStudentOpen(true)}
              >
                Thêm học sinh
              </Button>
            </div>
          </div>

          <div className="pt-4">
            {students.length === 0 ? (
              <EmptyState
                title="Chưa có dữ liệu học sinh trong lớp này"
                description="Lớp học chưa có học sinh nào. Thêm học sinh bằng mã ẩn danh."
                actionText="Thêm học sinh ngay"
                isActionUnimplemented={false}
                onAction={() => setIsAddStudentOpen(true)}
              />
            ) : (
              <>
                <Table columns={studentColumns} data={students} />
                <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
                  <span>Trang {studentPagination.page} / {studentPagination.totalPages} (Tổng {studentPagination.total} học sinh)</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={studentPagination.page <= 1}
                      onClick={() => fetchStudents(selectedClassId, studentPagination.page - 1)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={studentPagination.page >= studentPagination.totalPages}
                      onClick={() => fetchStudents(selectedClassId, studentPagination.page + 1)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* MODAL 1: TẠO LỚP HỌC */}
      <Modal isOpen={isCreateClassOpen} onClose={() => setIsCreateClassOpen(false)} title="Tạo Lớp học mới">
        <form onSubmit={handleCreateClass} className="space-y-3.5">
          <Input
            label="Mã lớp (VD: 4C, 4D)"
            value={classForm.code}
            onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
            placeholder="4C"
            required
          />
          <Input
            label="Tên lớp (VD: Lớp 4C)"
            value={classForm.name}
            onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            placeholder="Lớp 4C - Vui học Toán 4"
            required
          />
          <Input
            label="Năm học"
            value={classForm.academicYear}
            onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
            placeholder="2026-2027"
            required
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateClassOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận tạo lớp
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: PHÂN CÔNG GIÁO VIÊN */}
      <Modal isOpen={isAssignTeacherOpen} onClose={() => setIsAssignTeacherOpen(false)} title="Phân công Giáo viên vào Lớp">
        <form onSubmit={handleAssignTeacher} className="space-y-3.5">
          <p className="text-xs text-slate-600">
            Phân công cho lớp ID: <strong>{selectedClassId}</strong>
          </p>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn giáo viên</label>
            <select
              value={assignForm.teacherId}
              onChange={(e) => setAssignForm({ teacherId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white text-slate-900"
              required
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAssignTeacherOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận phân công
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: THÊM HỌC SINH */}
      <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Thêm Học sinh vào Lớp">
        <form onSubmit={handleAddStudent} className="space-y-3.5">
          <div className="p-2.5 bg-sky-50 rounded-lg text-xs text-sky-900 border border-sky-100">
            <strong>Nguyên tắc 9:</strong> Thu thập tối thiểu dữ liệu. Vui lòng sử dụng mã học sinh ẩn danh (VD: HS-4C-01) và biệt danh thay vì thông tin nhạy cảm.
          </div>
          <Input
            label="Mã học sinh ẩn danh (studentCode)"
            value={studentForm.studentCode}
            onChange={(e) => setStudentForm({ ...studentForm, studentCode: e.target.value })}
            placeholder="HS-4C-01"
            required
          />
          <Input
            label="Tên hiển thị hoặc Biệt danh"
            value={studentForm.displayName}
            onChange={(e) => setStudentForm({ ...studentForm, displayName: e.target.value })}
            placeholder="Em An [DỮ LIỆU MẪU]"
            required
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddStudentOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Thêm học sinh
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
