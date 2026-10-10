/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { AppRole } from '../../types/auth.ts';
import {
  LogIn,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Info,
  Building,
  GraduationCap,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (role: AppRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { login, firebaseStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const testAccounts = [
    {
      role: 'SUPER_ADMIN' as AppRole,
      label: 'Tổng Quản trị',
      email: 'superadmin@edunova.edu.vn',
      pass: 'SuperAdminPassword@2026',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      role: 'SCHOOL_ADMIN' as AppRole,
      label: 'Quản trị TH Alpha',
      email: 'admin.alpha@thalpha.edu.vn',
      pass: 'SchoolAlphaPass@2026',
      icon: <Building className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      role: 'TEACHER' as AppRole,
      label: 'Giáo viên 4A',
      email: 'teacher.nguyen@thalpha.edu.vn',
      pass: 'TeacherAlphaPass@2026',
      icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />,
    },
    {
      role: 'STUDENT' as AppRole,
      label: 'Học sinh Nam (4A)',
      email: 'student.nam@thalpha.edu.vn',
      pass: 'StudentAlphaPass@2026',
      icon: <GraduationCap className="w-3.5 h-3.5 text-sky-600" />,
    },
    {
      role: 'CONTENT_REVIEWER' as AppRole,
      label: 'Thẩm định viên',
      email: 'reviewer.toan@edunova.edu.vn',
      pass: 'ReviewerPass@2026',
      icon: <FileCheck className="w-3.5 h-3.5 text-amber-600" />,
    },
  ];

  const handleQuickFill = (acc: (typeof testAccounts)[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success && res.session) {
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess(res.session.role);
      }
    } else {
      setErrorMessage(res.error || 'Đăng nhập thất bại.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng nhập Nền tảng EDUNOVA"
      description="Xác thực danh tính thực tế với phân quyền 5 vai trò"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Thông báo trạng thái cấu hình Firebase theo Nguyên tắc 4 */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-sky-600" />
              Cơ chế xác thực hiện tại:
            </span>
            <span className="text-[10px] bg-sky-100 text-sky-900 font-bold px-1.5 py-0.5 rounded">
              Native Token Claims (Ký mật số)
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Firebase Auth chưa cấu hình khóa môi trường. Hệ thống tuân thủ Nguyên tắc 4: không giả lập kết nối Firebase, tự động vận hành xác thực có ký số bảo mật từ máy chủ backend.
          </p>
          <button
            type="button"
            onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
            className="text-sky-700 hover:text-sky-900 font-medium text-[11px] underline cursor-pointer"
          >
            {showFirebaseGuide ? 'Ẩn hướng dẫn Firebase' : 'Xem hướng dẫn cấu hình Firebase thực tế'}
          </button>

          {showFirebaseGuide && firebaseStatus && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] whitespace-pre-line leading-relaxed">
              {firebaseStatus.instructions}
            </div>
          )}
        </div>

        {errorMessage && (
          <Alert type="error" title="Lỗi đăng nhập">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Địa chỉ Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nhap.email@truong.edu.vn"
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * Giới hạn an toàn: Tối đa 5 lần thử / phút
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              icon={<LogIn className="w-4 h-4" />}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </div>
        </form>

        {/* Khu vực chọn nhanh tài khoản kiểm thử cho 5 vai trò */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              Tài khoản mẫu để kiểm tra 5 vai trò:
            </span>
            <span className="text-[10px] text-slate-400">Nhấn để điền</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {testAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-colors text-left cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {acc.icon}
                  <div>
                    <div className="font-semibold text-slate-900">{acc.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.email}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
