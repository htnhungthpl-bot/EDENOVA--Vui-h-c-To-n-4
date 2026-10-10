/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { AuthClaims, UserSession } from '../../src/types/auth.ts';

export class TokenService {
  private static secret: string =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    'edunova-secure-signing-key-' + crypto.randomBytes(32).toString('hex');

  private static base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  public static generateSession(
    claims: AuthClaims,
    expiresInSeconds: number = 86400 // 24 giờ
  ): UserSession {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + expiresInSeconds;

    const payload = {
      ...claims,
      iat: now,
      exp: expiresAt,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const token = `${dataToSign}.${signature}`;

    return {
      ...claims,
      token,
      expiresAt: expiresAt * 1000,
    };
  }

  public static verifyToken(token: string): AuthClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToSign = `${encodedHeader}.${encodedPayload}`;

      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(dataToSign)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const expectedBuf = Buffer.from(expectedSignature);
      const actualBuf = Buffer.from(signature);

      if (expectedBuf.length !== actualBuf.length) return null;
      if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return null; // Đã hết hạn
      }

      return {
        uid: payload.uid,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        schoolId: payload.schoolId,
        assignedClassIds: payload.assignedClassIds,
      };
    } catch {
      return null;
    }
  }
}
