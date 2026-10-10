/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import {
  authenticate,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth-middleware.ts';
import { AuditService } from '../services/audit-service.ts';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'CONTENT_REVIEWER'));

interface ContentItem {
  id: string;
  topicCode: string;
  title: string;
  version: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewedBy?: string;
  comments?: string;
  updatedAt: string;
}

const contentItems: ContentItem[] = [
  {
    id: 'cnt_001',
    topicCode: 'TOAN4-C1',
    title: 'Ngân hàng câu hỏi: Phân số bằng nhau & Rút gọn',
    version: 1,
    status: 'PENDING',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cnt_002',
    topicCode: 'TOAN4-C2',
    title: 'Bộ hình vẽ minh họa: Hai đường thẳng vuông góc',
    version: 1,
    status: 'PENDING',
    updatedAt: new Date().toISOString(),
  },
];

/**
 * GET /api/content/pending
 * Lấy danh sách nội dung đang chờ kiểm duyệt
 */
router.get('/pending', (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    items: contentItems,
  });
});

/**
 * POST /api/content/review
 * Duyệt, từ chối hoặc yêu cầu sửa đổi nội dung học liệu Toán 4
 */
router.post('/review', (req: AuthenticatedRequest, res: Response): void => {
  const { contentId, action, comments } = req.body;
  const actor = req.user!;

  if (!contentId || !['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(action)) {
    res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp contentId và action hợp lệ (APPROVE | REJECT | REQUEST_CHANGES).',
    });
    return;
  }

  const item = contentItems.find((c) => c.id === contentId);
  if (!item) {
    res.status(404).json({ success: false, error: 'Không tìm thấy nội dung học liệu.' });
    return;
  }

  const statusMap: Record<string, ContentItem['status']> = {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    REQUEST_CHANGES: 'NEEDS_REVISION',
  };

  item.status = statusMap[action];
  item.reviewedBy = actor.email;
  item.comments = comments || '';
  item.version += 1;
  item.updatedAt = new Date().toISOString();

  AuditService.record({
    actorId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: `CONTENT_${action}`,
    targetType: 'CONTENT',
    targetId: contentId,
    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    status: 'SUCCESS',
    details: {
      topicCode: item.topicCode,
      newStatus: item.status,
      version: item.version,
      comments,
    },
  });

  res.json({
    success: true,
    message: `Thao tác kiểm duyệt [${action}] đối với nội dung [${item.title}] thành công.`,
    item,
  });
});

/**
 * GET /api/content/versions
 * Xem lịch sử phiên bản học liệu
 */
router.get('/versions', (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    versions: contentItems.map((c) => ({
      contentId: c.id,
      title: c.title,
      version: c.version,
      status: c.status,
      lastReviewedBy: c.reviewedBy || 'Chưa kiểm duyệt',
      updatedAt: c.updatedAt,
    })),
  });
});

export default router;
