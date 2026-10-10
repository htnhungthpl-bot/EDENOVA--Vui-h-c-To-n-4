/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiSystemConfig, AiUsageRecord, AiUserQuotaInfo } from '../../src/types/ai.ts';

export class AiConfigStore {
  private static config: AiSystemConfig = {
    isAiEnabled: true,
    dailyStudentQuota: 20,
    dailyTeacherQuota: 50,
    warningThresholdPercent: 80,
    modelName: 'gemini-3.8-flash',
    isConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
  };

  // Lưu trữ số lượt hỏi theo ngày: key = "YYYY-MM-DD:userId" -> count
  private static dailyUserUsage = new Map<string, number>();

  // Nhật ký sử dụng AI
  private static usageRecords: AiUsageRecord[] = [];

  public static getConfig(): AiSystemConfig {
    return {
      ...this.config,
      isConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
    };
  }

  public static updateConfig(newConfig: Partial<Omit<AiSystemConfig, 'modelName' | 'isConfigured'>>): AiSystemConfig {
    if (typeof newConfig.isAiEnabled === 'boolean') {
      this.config.isAiEnabled = newConfig.isAiEnabled;
    }
    if (typeof newConfig.dailyStudentQuota === 'number' && newConfig.dailyStudentQuota > 0) {
      this.config.dailyStudentQuota = newConfig.dailyStudentQuota;
    }
    if (typeof newConfig.dailyTeacherQuota === 'number' && newConfig.dailyTeacherQuota > 0) {
      this.config.dailyTeacherQuota = newConfig.dailyTeacherQuota;
    }
    if (typeof newConfig.warningThresholdPercent === 'number' && newConfig.warningThresholdPercent > 0) {
      this.config.warningThresholdPercent = newConfig.warningThresholdPercent;
    }
    return this.getConfig();
  }

  private static getTodayKey(userId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `${today}:${userId}`;
  }

  public static getQuotaInfo(userId: string, role: string): AiUserQuotaInfo {
    const limit = role === 'STUDENT' ? this.config.dailyStudentQuota : this.config.dailyTeacherQuota;
    const key = this.getTodayKey(userId);
    const used = this.dailyUserUsage.get(key) || 0;
    const remaining = Math.max(0, limit - used);
    const thresholdCount = Math.floor((limit * this.config.warningThresholdPercent) / 100);
    const nearQuota = used >= thresholdCount && remaining > 0;

    return {
      usedToday: used,
      dailyLimit: limit,
      remaining,
      nearQuota,
    };
  }

  public static consumeQuota(userId: string, role: string): { allowed: boolean; quota: AiUserQuotaInfo } {
    const quota = this.getQuotaInfo(userId, role);
    if (quota.usedToday >= quota.dailyLimit) {
      return { allowed: false, quota };
    }

    const key = this.getTodayKey(userId);
    const newCount = quota.usedToday + 1;
    this.dailyUserUsage.set(key, newCount);

    return {
      allowed: true,
      quota: {
        ...quota,
        usedToday: newCount,
        remaining: Math.max(0, quota.dailyLimit - newCount),
        nearQuota: newCount >= Math.floor((quota.dailyLimit * this.config.warningThresholdPercent) / 100),
      },
    };
  }

  public static addUsageRecord(record: Omit<AiUsageRecord, 'id' | 'timestamp'>): AiUsageRecord {
    const newRecord: AiUsageRecord = {
      ...record,
      id: `ai_rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.usageRecords.unshift(newRecord);
    // Giữ tối đa 1000 bản ghi trong bộ nhớ
    if (this.usageRecords.length > 1000) {
      this.usageRecords.pop();
    }
    return newRecord;
  }

  public static getUsageRecords(filter?: {
    role?: string;
    lessonId?: string;
    status?: string;
    limit?: number;
  }): { records: AiUsageRecord[]; total: number } {
    let list = [...this.usageRecords];
    if (filter?.role) {
      list = list.filter((r) => r.userRole === filter.role);
    }
    if (filter?.lessonId) {
      list = list.filter((r) => r.lessonId === filter.lessonId);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    const total = list.length;
    const limit = filter?.limit || 50;
    return { records: list.slice(0, limit), total };
  }

  public static resetQuotasForTesting(): void {
    this.dailyUserUsage.clear();
  }

  public static resetRecordsForTesting(): void {
    this.usageRecords = [];
  }
}
