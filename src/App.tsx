/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole, NavigationTarget } from './types/index.ts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppRole } from './types/auth.ts';
import { MainLayout } from './layouts/MainLayout.tsx';
import { StudentLayout } from './layouts/StudentLayout.tsx';
import { TeacherLayout } from './layouts/TeacherLayout.tsx';
import { AdminLayout } from './layouts/AdminLayout.tsx';
import { ParentLayout } from './layouts/ParentLayout.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { UserGuidePage } from './pages/UserGuidePage.tsx';
import { StudentDashboard } from './pages/StudentDashboard.tsx';
import { TeacherDashboard } from './pages/TeacherDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { SchoolAdminDashboard } from './pages/SchoolAdminDashboard.tsx';
import { ParentDashboard } from './pages/ParentDashboard.tsx';
import { ContentReviewerDashboard } from './pages/ContentReviewerDashboard.tsx';
import { CurriculumCatalogPage } from './pages/CurriculumCatalogPage.tsx';
import { LessonDetailPage } from './pages/LessonDetailPage.tsx';
import { QuestionBankPage } from './pages/QuestionBankPage.tsx';
import { UnimplementedModal } from './components/common/UnimplementedModal.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { Alert } from './components/ui/Alert.tsx';
import { Button } from './components/ui/Button.tsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function AppContent() {
  const { session, isAuthenticated } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>('public');
  const [currentTarget, setCurrentTarget] = useState<NavigationTarget>('landing');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson_01');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Modal cảnh báo chức năng chưa triển khai (Nguyên tắc 2)
  const [unimplementedModal, setUnimplementedModal] = useState<{
    isOpen: boolean;
    featureName: string;
    expectedPhase?: string;
  }>({
    isOpen: false,
    featureName: '',
  });

  const handleOpenUnimplemented = (
    featureName: string,
    expectedPhase = 'Giai đoạn tiếp theo (Tích hợp CSDL & Backend)'
  ) => {
    setUnimplementedModal({
      isOpen: true,
      featureName,
      expectedPhase,
    });
  };

  const handleCloseUnimplemented = () => {
    setUnimplementedModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'student') setCurrentTarget('student-dashboard');
    else if (role === 'teacher') setCurrentTarget('teacher-dashboard');
    else if (role === 'admin') setCurrentTarget('admin-dashboard');
    else if (role === 'parent') setCurrentTarget('parent-dashboard');
    else setCurrentTarget('landing');
  };

  const handleNavigate = (target: NavigationTarget) => {
    setCurrentTarget(target);
    if (target === 'landing' || target === 'privacy' || target === 'guide' || target === 'math4') {
      if (currentRole !== 'public' && target === 'landing') {
        setCurrentRole('public');
      }
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentTarget('lesson-detail');
  };

  const handleLoginSuccess = (role: AppRole) => {
    if (role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') {
      setCurrentRole('admin');
      setCurrentTarget('admin-dashboard');
    } else if (role === 'TEACHER') {
      setCurrentRole('teacher');
      setCurrentTarget('teacher-dashboard');
    } else if (role === 'STUDENT') {
      setCurrentRole('student');
      setCurrentTarget('student-dashboard');
    } else if (role === 'CONTENT_REVIEWER') {
      setCurrentRole('admin');
      setCurrentTarget('admin-dashboard');
    }
  };

  // Route Guard ở Frontend (Nguyên tắc 5)
  const isRouteAllowed = (): boolean => {
    if (!isAuthenticated || !session) return true;

    if (session.role === 'STUDENT') {
      if (currentRole === 'admin' || currentRole === 'teacher') return false;
    }
    if (session.role === 'TEACHER') {
      if (currentRole === 'admin') return false;
    }
    return true;
  };

  // Render view tương ứng với target và role
  const renderCurrentView = () => {
    if (!isRouteAllowed()) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">
              Bị từ chối truy cập (Frontend Route Guard)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tài khoản hiện tại có vai trò <strong>[{session?.role}]</strong>. Theo ma trận phân quyền, bạn không có quyền truy cập không gian làm việc của <strong>[{currentRole}]</strong>.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 text-left">
              * Ghi chú kỹ thuật: Bảo vệ giao diện này chỉ phục vụ trải nghiệm người dùng; bảo mật cốt lõi được thực thi bởi middleware máy chủ backend (HTTP 401/403).
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
              onClick={() => {
                if (session?.role === 'STUDENT') handleRoleChange('student');
                else if (session?.role === 'TEACHER') handleRoleChange('teacher');
                else handleRoleChange('admin');
              }}
            >
              Quay về không gian làm việc của bạn
            </Button>
          </div>
        </div>
      );
    }

    // 0. CÁC TRANG CHUYÊN ĐỀ SƯ PHẠM (DÙNG CHUNG TRONG LAYOUT TƯƠNG ỨNG)
    if (currentTarget === 'curriculum-catalog') {
      const Content = (
        <CurriculumCatalogPage
          onSelectLesson={handleSelectLesson}
          onBack={() => {
            if (currentRole === 'student') setCurrentTarget('student-dashboard');
            else if (currentRole === 'teacher') setCurrentTarget('teacher-dashboard');
            else if (session?.role === 'CONTENT_REVIEWER') setCurrentTarget('admin-dashboard');
            else setCurrentTarget('landing');
          }}
        />
      );

      if (currentRole === 'student') {
        return (
          <StudentLayout activeItem="practice" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </StudentLayout>
        );
      }
      if (currentRole === 'teacher') {
        return (
          <TeacherLayout activeItem="classes" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </TeacherLayout>
        );
      }
      if (session?.role === 'CONTENT_REVIEWER' || currentRole === 'admin') {
        return (
          <AdminLayout activeItem="content-review" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </AdminLayout>
        );
      }
      return (
        <MainLayout currentTarget={currentTarget} onNavigate={handleNavigate} currentRole={currentRole} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented} onOpenLogin={() => setLoginModalOpen(true)}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {Content}
          </div>
        </MainLayout>
      );
    }

    if (currentTarget === 'lesson-detail') {
      const Content = (
        <LessonDetailPage
          lessonId={selectedLessonId}
          onBack={() => setCurrentTarget('curriculum-catalog')}
          onPracticeClick={
            currentRole === 'student'
              ? () => setCurrentTarget('student-dashboard')
              : undefined
          }
        />
      );

      if (currentRole === 'student') {
        return (
          <StudentLayout activeItem="practice" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </StudentLayout>
        );
      }
      if (currentRole === 'teacher') {
        return (
          <TeacherLayout activeItem="classes" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </TeacherLayout>
        );
      }
      if (session?.role === 'CONTENT_REVIEWER' || currentRole === 'admin') {
        return (
          <AdminLayout activeItem="content-review" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </AdminLayout>
        );
      }
      return (
        <MainLayout currentTarget={currentTarget} onNavigate={handleNavigate} currentRole={currentRole} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented} onOpenLogin={() => setLoginModalOpen(true)}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {Content}
          </div>
        </MainLayout>
      );
    }

    if (currentTarget === 'teacher-question-bank') {
      const Content = (
        <QuestionBankPage
          onBack={() => {
            if (currentRole === 'teacher') setCurrentTarget('teacher-dashboard');
            else if (session?.role === 'CONTENT_REVIEWER') setCurrentTarget('admin-dashboard');
            else setCurrentTarget('landing');
          }}
        />
      );

      if (currentRole === 'teacher') {
        return (
          <TeacherLayout activeItem="question-bank" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </TeacherLayout>
        );
      }
      if (session?.role === 'CONTENT_REVIEWER' || currentRole === 'admin') {
        return (
          <AdminLayout activeItem="content-review" onNavigate={handleNavigate} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented}>
            {Content}
          </AdminLayout>
        );
      }
      return (
        <MainLayout currentTarget={currentTarget} onNavigate={handleNavigate} currentRole={currentRole} onRoleChange={handleRoleChange} onOpenUnimplemented={handleOpenUnimplemented} onOpenLogin={() => setLoginModalOpen(true)}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {Content}
          </div>
        </MainLayout>
      );
    }

    // 1. Phân hệ Thẩm định viên (nếu đăng nhập với vai trò CONTENT_REVIEWER)
    if (session?.role === 'CONTENT_REVIEWER') {
      return (
        <AdminLayout
          activeItem="content-review"
          onNavigate={handleNavigate}
          onRoleChange={handleRoleChange}
          onOpenUnimplemented={handleOpenUnimplemented}
        >
          <ContentReviewerDashboard onSelectLesson={handleSelectLesson} />
        </AdminLayout>
      );
    }

    // 2. Phân hệ Học sinh
    if (currentRole === 'student') {
      return (
        <StudentLayout
          activeItem={
            currentTarget === 'student-practice'
              ? 'practice'
              : currentTarget === 'student-ai-tutor'
              ? 'ai-tutor'
              : 'dashboard'
          }
          onNavigate={handleNavigate}
          onRoleChange={handleRoleChange}
          onOpenUnimplemented={handleOpenUnimplemented}
        >
          <StudentDashboard
            onNavigate={handleNavigate}
            onOpenUnimplemented={handleOpenUnimplemented}
            onSelectLesson={handleSelectLesson}
          />
        </StudentLayout>
      );
    }

    // 3. Phân hệ Giáo viên
    if (currentRole === 'teacher') {
      return (
        <TeacherLayout
          activeItem={
            currentTarget === 'teacher-classes'
              ? 'classes'
              : 'dashboard'
          }
          onNavigate={handleNavigate}
          onRoleChange={handleRoleChange}
          onOpenUnimplemented={handleOpenUnimplemented}
        >
          <TeacherDashboard
            onNavigate={handleNavigate}
            onOpenUnimplemented={handleOpenUnimplemented}
            onSelectLesson={handleSelectLesson}
          />
        </TeacherLayout>
      );
    }

    // 4. Phân hệ Quản trị Nhà trường & SUPER_ADMIN
    if (currentRole === 'admin') {
      return (
        <AdminLayout
          activeItem={currentTarget === 'admin-schools' ? 'schools' : 'dashboard'}
          onNavigate={handleNavigate}
          onRoleChange={handleRoleChange}
          onOpenUnimplemented={handleOpenUnimplemented}
        >
          {session?.role === 'SCHOOL_ADMIN' ? (
            <SchoolAdminDashboard />
          ) : (
            <AdminDashboard
              onNavigate={handleNavigate}
              onOpenUnimplemented={handleOpenUnimplemented}
            />
          )}
        </AdminLayout>
      );
    }

    // 5. Phân hệ Phụ huynh
    if (currentRole === 'parent') {
      return (
        <ParentLayout
          activeItem={currentTarget === 'parent-reports' ? 'reports' : 'dashboard'}
          onNavigate={handleNavigate}
          onRoleChange={handleRoleChange}
          onOpenUnimplemented={handleOpenUnimplemented}
        >
          <ParentDashboard
            onNavigate={handleNavigate}
            onOpenUnimplemented={handleOpenUnimplemented}
          />
        </ParentLayout>
      );
    }

    // 6. Khách công khai (Landing, Chính sách, Hướng dẫn)
    return (
      <MainLayout
        currentTarget={currentTarget}
        onNavigate={handleNavigate}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenUnimplemented={handleOpenUnimplemented}
        onOpenLogin={() => setLoginModalOpen(true)}
      >
        {currentTarget === 'privacy' ? (
          <PrivacyPolicyPage
            onNavigate={handleNavigate}
            onOpenUnimplemented={handleOpenUnimplemented}
          />
        ) : currentTarget === 'guide' ? (
          <UserGuidePage
            onNavigate={handleNavigate}
            onOpenUnimplemented={handleOpenUnimplemented}
          />
        ) : (
          <LandingPage
            onNavigate={handleNavigate}
            onRoleChange={handleRoleChange}
            onOpenUnimplemented={handleOpenUnimplemented}
          />
        )}
      </MainLayout>
    );
  };

  return (
    <>
      {renderCurrentView()}

      {/* Modal đăng nhập thực tế */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal cảnh báo chức năng chưa triển khai theo nguyên tắc 2 */}
      <UnimplementedModal
        isOpen={unimplementedModal.isOpen}
        onClose={handleCloseUnimplemented}
        featureName={unimplementedModal.featureName}
        expectedPhase={unimplementedModal.expectedPhase}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
