/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthClaims } from '../../src/types/auth.ts';

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  instructions: string;
}

export class FirebaseAuthAdapter {
  /**
   * Kiểm tra xem các biến môi trường Firebase Authentication đã được cấu hình đầy đủ chưa.
   */
  public static checkConfiguration(): FirebaseConfigStatus {
    const requiredEnv = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
    ];

    const missingKeys = requiredEnv.filter((key) => !process.env[key]);

    const isConfigured = missingKeys.length === 0;

    const instructions = isConfigured
      ? 'Firebase Authentication đã được nạp biến môi trường hợp lệ.'
      : `Để kích hoạt Firebase Authentication thực tế, bạn cần cấu hình các biến môi trường trong file .env:\n` +
        `1. FIREBASE_PROJECT_ID: Project ID từ Firebase Console\n` +
        `2. FIREBASE_CLIENT_EMAIL: Service Account Email từ Firebase IAM\n` +
        `3. FIREBASE_PRIVATE_KEY: Service Account Private Key (dạng PEM)\n` +
        `4. Ở client: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID\n` +
        `\nTheo Nguyên tắc 4: Hệ thống không giả lập kết nối thành công khi thiếu các cấu hình này.`;

    return {
      isConfigured,
      missingKeys,
      instructions,
    };
  }

  /**
   * Xác thực Firebase ID Token thực tế.
   * Nếu chưa cấu hình, hàm này sẽ ném lỗi rõ ràng, tuyệt đối không giả lập đăng nhập thành công.
   */
  public static async verifyIdToken(idToken: string): Promise<AuthClaims> {
    const status = this.checkConfiguration();
    if (!status.isConfigured) {
      throw new Error(
        `[Firebase Error] Firebase Authentication chưa được cấu hình. Các khóa còn thiếu: ${status.missingKeys.join(
          ', '
        )}. Không giả lập kết nối theo Nguyên tắc 4.`
      );
    }

    // Khi đã cấu hình, giải mã và đối soát token Firebase
    // Payload mẫu từ Firebase decoded token
    try {
      // Trong môi trường production có SDK, sẽ gọi admin.auth().verifyIdToken(idToken)
      // Hiện tại nếu có idToken giả dạng sẽ bị từ chối
      if (!idToken || idToken.length < 20) {
        throw new Error('Mã Firebase ID Token không hợp lệ.');
      }
      throw new Error('Chưa hoàn tất kết nối chứng chỉ Firebase Admin SDK.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác thực Firebase thất bại';
      throw new Error(`Xác thực Firebase thất bại: ${msg}`);
    }
  }
}
