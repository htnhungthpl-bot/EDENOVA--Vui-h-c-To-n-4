/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, UserSession, LoginCredentials, AuthResponse } from '../types/auth.ts';
import { FirebaseConfigStatus } from '../../server/auth/firebase-adapter.ts';

interface AuthContextType {
  session: UserSession | null;
  isAuthenticated: boolean;
  role: AppRole | 'GUEST';
  schoolId?: string;
  loading: boolean;
  firebaseStatus: FirebaseConfigStatus | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkPermission: (requiredRoles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'edunova_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConfigStatus | null>(null);

  // Khởi tạo: kiểm tra phiên lưu trữ và trạng thái Firebase
  useEffect(() => {
    const initAuth = async () => {
      // 1. Khôi phục phiên đã lưu
      const savedSession = localStorage.getItem(STORAGE_KEY);
      if (savedSession) {
        try {
          const parsed: UserSession = JSON.parse(savedSession);
          if (parsed.expiresAt > Date.now()) {
            setSession(parsed);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // 2. Kiểm tra trạng thái cấu hình Firebase
      try {
        const res = await fetch('/api/auth/firebase-status');
        if (res.ok) {
          const data = await res.json();
          setFirebaseStatus(data.status);
        }
      } catch (err) {
        console.warn('Không thể kiểm tra trạng thái Firebase:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Đăng nhập không thành công',
          errorCode: data.errorCode,
        };
      }

      if (data.session) {
        setSession(data.session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
      }

      return {
        success: true,
        session: data.session,
        message: data.message,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      return {
        success: false,
        error: `Không thể kết nối tới máy chủ xác thực: ${message}`,
      };
    }
  };

  const logout = async (): Promise<void> => {
    if (session) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
        });
      } catch (err) {
        console.error('Lỗi khi gọi API đăng xuất:', err);
      }
    }
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const checkPermission = (requiredRoles: AppRole[]): boolean => {
    if (!session) return false;
    return requiredRoles.includes(session.role);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        role: session ? session.role : 'GUEST',
        schoolId: session?.schoolId,
        loading,
        firebaseStatus,
        login,
        logout,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
