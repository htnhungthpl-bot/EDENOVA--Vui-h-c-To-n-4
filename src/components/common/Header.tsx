/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { Button } from '../ui/Button.tsx';
import { NavigationTarget, UserRole } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Menu,
  X,
  GraduationCap,
  BookOpen,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  LogIn,
  LogOut,
  FileCheck,
  User,
} from 'lucide-react';

export interface HeaderProps {
  currentTarget: NavigationTarget;
  onNavigate: (target: NavigationTarget) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenUnimplemented: (featureName: string) => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTarget,
  onNavigate,
  currentRole,
  onRoleChange,
  onOpenUnimplemented,
  onOpenLogin,
}) => {
  const { session, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    public: { label: 'Khách (Công khai)', icon: <BookOpen className="w-3.5 h-3.5" /> },
    student: { label: 'Học sinh lớp 4', icon: <GraduationCap className="w-3.5 h-3.5 text-sky-600" /> },
    teacher: { label: 'Giáo viên', icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> },
    admin: { label: 'Nhà trường / Quản trị', icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> },
    parent: { label: 'Phụ huynh', icon: <GraduationCap className="w-3.5 h-3.5 text-amber-600" /> },
    reviewer: { label: 'Thẩm định viên', icon: <FileCheck className="w-3.5 h-3.5 text-amber-600" /> },
  };

  const navLinks: Array<{ label: string; target: NavigationTarget }> = [
    { label: 'Trang chủ', target: 'landing' },
    { label: 'Vui học Toán 4', target: 'math4' },
    { label: 'Hướng dẫn sử dụng', target: 'guide' },
    { label: 'Chính sách bảo mật', target: 'privacy' },
  ];

  const handleSelectRole = (role: UserRole) => {
    onRoleChange(role);
    setRoleDropdownOpen(false);
    if (role === 'student') onNavigate('student-dashboard');
    else if (role === 'teacher') onNavigate('teacher-dashboard');
    else if (role === 'admin') onNavigate('admin-dashboard');
    else if (role === 'parent') onNavigate('parent-dashboard');
    else onNavigate('landing');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand */}
          <Logo
            size="md"
            subtitleText="Vui học Toán 4"
            onClick={() => {
              onNavigate('landing');
              if (currentRole !== 'public') onRoleChange('public');
            }}
          />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => {
                  if (currentRole !== 'public') onRoleChange('public');
                  onNavigate(link.target);
                }}
                className={`text-sm font-medium transition-colors py-1 relative cursor-pointer ${
                  currentTarget === link.target && currentRole === 'public'
                    ? 'text-[#0F294A] font-semibold border-b-2 border-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Role Switcher & Auth Area */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Vai trò Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                aria-haspopup="true"
                aria-expanded={roleDropdownOpen}
              >
                <span className="text-slate-400">Xem giao diện:</span>
                <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                  {roleLabels[currentRole]?.icon}
                  {roleLabels[currentRole]?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in duration-100"
                  onMouseLeave={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Khung giao diện theo vai trò
                  </div>
                  {(['public', 'student', 'teacher', 'admin', 'parent'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                        currentRole === role ? 'bg-sky-50 text-sky-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {roleLabels[role]?.icon}
                      <span>{roleLabels[role]?.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trạng thái xác thực thật */}
            {isAuthenticated && session ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{session.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    [{session.role}] {session.schoolId ? `· ${session.schoolId}` : ''}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogOut className="w-3.5 h-3.5" />}
                  onClick={() => {
                    logout();
                    onRoleChange('public');
                    onNavigate('landing');
                  }}
                >
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<LogIn className="w-3.5 h-3.5" />}
                onClick={onOpenLogin}
              >
                Đăng nhập
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Điều hướng chính
            </div>
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => {
                  if (currentRole !== 'public') onRoleChange('public');
                  onNavigate(link.target);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentTarget === link.target && currentRole === 'public'
                    ? 'bg-sky-50 text-sky-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Khung giao diện vai trò
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {(['public', 'student', 'teacher', 'admin', 'parent'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    handleSelectRole(role);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                    currentRole === role
                      ? 'bg-sky-100 text-sky-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {roleLabels[role]?.icon}
                  <span className="truncate">{roleLabels[role]?.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="md"
                className="w-full"
                icon={<LogOut className="w-4 h-4" />}
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  onRoleChange('public');
                  onNavigate('landing');
                }}
              >
                Đăng xuất ({session?.name})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={<LogIn className="w-4 h-4" />}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
              >
                Đăng nhập tài khoản
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
