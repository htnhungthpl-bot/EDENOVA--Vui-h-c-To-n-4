/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppRole, AuthClaims } from '../../src/types/auth.ts';
import { PasswordHasher } from '../auth/password-hasher.ts';

export interface UserAccount extends AuthClaims {
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserStore {
  private static users = new Map<string, UserAccount>(); // key: uid
  private static emailIndex = new Map<string, string>(); // key: email.toLowerCase() -> uid
  private static initialSuperAdminCreated = false;

  public static isInitialSuperAdminCreated(): boolean {
    return this.initialSuperAdminCreated;
  }

  public static setInitialSuperAdminCreated(created: boolean) {
    this.initialSuperAdminCreated = created;
  }

  public static findByEmail(email: string): UserAccount | null {
    const uid = this.emailIndex.get(email.toLowerCase().trim());
    if (!uid) return null;
    return this.users.get(uid) || null;
  }

  public static findById(uid: string): UserAccount | null {
    return this.users.get(uid) || null;
  }

  public static createUser(userData: {
    uid: string;
    email: string;
    name: string;
    password: string;
    role: AppRole;
    schoolId?: string;
    assignedClassIds?: string[];
  }): UserAccount {
    const emailKey = userData.email.toLowerCase().trim();
    if (this.emailIndex.has(emailKey)) {
      throw new Error(`Email ${userData.email} đã tồn tại trong hệ thống.`);
    }

    const now = new Date().toISOString();
    const account: UserAccount = {
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      schoolId: userData.schoolId,
      assignedClassIds: userData.assignedClassIds || [],
      passwordHash: PasswordHasher.hashPassword(userData.password),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(account.uid, account);
    this.emailIndex.set(emailKey, account.uid);
    return account;
  }

  public static updateUserRole(
    targetUid: string,
    newRole: AppRole,
    newSchoolId?: string
  ): UserAccount {
    const user = this.users.get(targetUid);
    if (!user) {
      throw new Error('Không tìm thấy tài khoản người dùng.');
    }

    user.role = newRole;
    if (newSchoolId !== undefined) {
      user.schoolId = newSchoolId;
    }
    user.updatedAt = new Date().toISOString();
    return user;
  }

  public static getSchoolUsers(schoolId: string): UserAccount[] {
    return Array.from(this.users.values()).filter((u) => u.schoolId === schoolId);
  }

  public static getAllUsers(): UserAccount[] {
    return Array.from(this.users.values());
  }

  public static resetForTesting() {
    this.users.clear();
    this.emailIndex.clear();
    this.initialSuperAdminCreated = false;
  }
}
