/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from '../components/common/Logo.tsx';
import { Button } from '../components/ui/Button.tsx';
import { NavigationTarget, UserRole } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Building2,
  Users2,
  Settings,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

export interface AdminLayoutProps {
  children: React.ReactNode;
  activeItem: string;
  onNavigate: (target: NavigationTarget) => void;
  onRoleChange: (role: UserRole) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeItem,
  onNavigate,
  onRoleChange,
  onOpenUnimplemented,
}) => {
  const { session, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan Nhà trường',
      target: 'admin-dashboard' as NavigationTarget,
      icon: <Building2 className="w-4 h-4 text-[#0F294A]" />,
    },
    {
      id: 'schools',
      label: 'Quản lý Đơn vị & Khối lớp',
      target: 'admin-schools' as NavigationTarget,
      icon: <Users2 className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'system',
      label: 'Kiểm toán & Bảo mật CSDL',
      target: 'admin-dashboard' as NavigationTarget,
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
    },
    {
      id: 'settings',
      label: 'Cấu hình tham số hệ thống',
      target: 'admin-dashboard' as NavigationTarget,
      icon: <Settings className="w-4 h-4 text-slate-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Mở menu quản trị"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size="sm" subtitleText="Cổng Quản trị Nhà trường" onClick={() => onNavigate('landing')} />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 text-xs text-purple-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>
                {isAuthenticated && session
                  ? `${session.name} [${session.role}]`
                  : 'Quản trị viên Nhà trường (Khung thử nghiệm)'}
              </span>
            </div>

            {isAuthenticated ? (
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
            ) : (
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => {
                  onRoleChange('public');
                  onNavigate('landing');
                }}
              >
                Về Trang chủ
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex-1 flex px-4 sm:px-6 py-6 gap-6">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto lg:rounded-xl lg:border lg:h-fit ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nghiệp vụ Quản trị
            </span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.target);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeItem === item.id
                    ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
