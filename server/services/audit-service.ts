/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { AuditLog, AppRole } from '../../src/types/auth.ts';

export class AuditService {
  private static logs: AuditLog[] = [];
  private static readonly MAX_LOGS = 10000;

  public static record(entry: {
    actorId: string;
    actorEmail: string;
    actorRole: AppRole;
    action: string;
    targetType: AuditLog['targetType'];
    targetId?: string;
    schoolId?: string;
    ip: string;
    status: 'SUCCESS' | 'DENIED' | 'FAILED';
    details?: Record<string, unknown>;
  }): AuditLog {
    const log: AuditLog = {
      id: 'audit_' + crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(log);

    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    return log;
  }

  public static query(params: {
    requesterRole: AppRole;
    requesterSchoolId?: string;
    targetSchoolId?: string;
    limit?: number;
    action?: string;
  }): AuditLog[] {
    let result = [...this.logs];

    // Quy tắc bảo mật: SCHOOL_ADMIN chỉ được xem log của trường mình
    if (params.requesterRole === 'SCHOOL_ADMIN') {
      result = result.filter(
        (log) => log.schoolId === params.requesterSchoolId
      );
    } else if (params.requesterRole !== 'SUPER_ADMIN') {
      // Các vai trò khác không được xem Audit Logs
      return [];
    }

    if (params.targetSchoolId) {
      result = result.filter((log) => log.schoolId === params.targetSchoolId);
    }

    if (params.action) {
      result = result.filter((log) => log.action === params.action);
    }

    const limit = params.limit || 50;
    return result.slice(0, limit);
  }

  public static clearForTesting() {
    this.logs = [];
  }
}
