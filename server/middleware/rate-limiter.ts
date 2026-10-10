/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private requests = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Định kỳ dọn dẹp bộ nhớ mỗi 5 phút
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);
      if (record.timestamps.length === 0) {
        this.requests.delete(key);
      }
    }
  }

  public getMiddleware(customKeyExtractor?: (req: Request) => string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const key = customKeyExtractor ? customKeyExtractor(req) : `${req.path}:${ip}`;
      const now = Date.now();

      let record = this.requests.get(key);
      if (!record) {
        record = { timestamps: [] };
        this.requests.set(key, record);
      }

      // Lọc các yêu cầu trong cửa sổ thời gian
      record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);

      if (record.timestamps.length >= this.maxRequests) {
        const oldest = record.timestamps[0];
        const retryAfterSec = Math.ceil((this.windowMs - (now - oldest)) / 1000);

        res.status(429).json({
          success: false,
          errorCode: 'RATE_LIMITED',
          error: `Đã vượt quá giới hạn yêu cầu (${this.maxRequests} lần/${this.windowMs / 1000}s). Vui lòng thử lại sau ${retryAfterSec} giây.`,
          retryAfter: retryAfterSec,
        });
        return;
      }

      record.timestamps.push(now);
      next();
    };
  }

  // Phương thức reset phục vụ cho Unit Test
  public reset() {
    this.requests.clear();
  }
}

// Giới hạn cho API Đăng nhập: 5 lần / 60 giây
export const loginRateLimiter = new SlidingWindowRateLimiter(60 * 1000, 5);

// Giới hạn cho các tác vụ quản trị nhạy cảm: 20 lần / 60 giây
export const sensitiveAdminRateLimiter = new SlidingWindowRateLimiter(60 * 1000, 20);
