/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Construction, CheckCircle2 } from 'lucide-react';

export interface UnimplementedModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  expectedPhase?: string;
  technicalReason?: string;
}

export const UnimplementedModal: React.FC<UnimplementedModalProps> = ({
  isOpen,
  onClose,
  featureName = 'Tính năng này',
  expectedPhase = 'Giai đoạn tiếp theo (Tích hợp CSDL & Backend)',
  technicalReason = 'Theo nguyên tắc số 2 của dự án: mọi chức năng chưa hoàn thành được hiển thị rõ ràng trạng thái "Chưa triển khai" để đảm bảo tính minh bạch, không dùng nút trang trí hay dữ liệu giả lập.',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thông báo: Chức năng chưa triển khai"
      description="Minh bạch tiến độ phát triển hệ thống EDUNOVA"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Đã hiểu & Đóng
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-slate-700">
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
          <Construction className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              {featureName} đang ở trạng thái chuẩn bị phát triển
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Kế hoạch hoàn thiện: <strong>{expectedPhase}</strong>.
            </p>
          </div>
        </div>

        <div className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="font-medium text-slate-800 mb-1">Cơ sở kỹ thuật & Quy chuẩn:</p>
          <p>{technicalReason}</p>
        </div>

        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
          <li>Không giả lập kết nối hoặc tạo hành vi bấm nút giả mạo.</li>
          <li>Mã nguồn sẽ được kiểm thử và triển khai từng bước có kiểm soát.</li>
          <li>Bạn có thể trải nghiệm các khung giao diện, tài liệu và quy chuẩn đã hoàn thành.</li>
        </ul>
      </div>
    </Modal>
  );
};
