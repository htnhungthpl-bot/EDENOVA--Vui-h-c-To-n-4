/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../components/common/Header.tsx';
import { Footer } from '../components/common/Footer.tsx';
import { NavigationTarget, UserRole } from '../types/index.ts';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentTarget: NavigationTarget;
  onNavigate: (target: NavigationTarget) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenUnimplemented: (featureName: string) => void;
  onOpenLogin: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTarget,
  onNavigate,
  currentRole,
  onRoleChange,
  onOpenUnimplemented,
  onOpenLogin,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header
        currentTarget={currentTarget}
        onNavigate={onNavigate}
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        onOpenUnimplemented={onOpenUnimplemented}
        onOpenLogin={onOpenLogin}
      />
      <main className="flex-1">{children}</main>
      <Footer onNavigate={onNavigate} onOpenUnimplemented={onOpenUnimplemented} />
    </div>
  );
};
