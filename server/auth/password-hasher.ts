/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export class PasswordHasher {
  private static readonly KEY_LEN = 64;

  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, this.KEY_LEN);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  public static verifyPassword(password: string, combinedHash: string): boolean {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;

    const [salt, originalHash] = parts;
    const derivedKey = crypto.scryptSync(password, salt, this.KEY_LEN);
    const originalBuffer = Buffer.from(originalHash, 'hex');

    if (derivedKey.length !== originalBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, originalBuffer);
  }
}
