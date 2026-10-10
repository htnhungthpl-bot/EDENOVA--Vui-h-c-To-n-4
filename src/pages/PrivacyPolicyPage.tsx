/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { NavigationTarget } from '../types/index.ts';
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft, EyeOff, UserCheck } from 'lucide-react';

export interface PrivacyPolicyPageProps {
  onNavigate: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onNavigate,
  onOpenUnimplemented,
}) => {
  return (
    <div className="py-10 sm:py-16 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Nút quay lại */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate('landing')}
          >
            Quay lại Trang chủ
          </Button>
        </div>

        {/* Cảnh báo bắt buộc: Bản nháp cần rà soát pháp lý */}
        <Alert
          type="warning"
          title="Thông báo pháp lý: Tài liệu dự thảo (Cần rà soát pháp lý chính thức)"
          className="mb-8"
        >
          Nội dung chính sách dưới đây là bản thảo khung kỹ thuật do đội ngũ phát triển xây dựng nhằm định hình các tiêu chuẩn an toàn dữ liệu và quyền riêng tư cho học sinh tiểu học. Tài liệu này cần được thẩm định và phê duyệt bởi chuyên gia pháp lý và cơ quan quản lý trước khi áp dụng chính thức.
        </Alert>

        {/* Nội dung chính sách */}
        <Card className="space-y-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Chính sách Bảo vệ Dữ liệu & Quyền Riêng tư</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
              Cam kết Bảo vệ Quyền Riêng tư Học sinh & Trẻ em
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Phiên bản: 0.1-DRAFT · Cập nhật kỹ thuật: Tháng 10/2026 · Tình trạng: Chờ phê duyệt pháp lý
            </p>
          </div>

          {/* Mục 1: Nguyên tắc thu thập tối thiểu */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-sky-600" />
              1. Nguyên tắc thu thập tối thiểu dữ liệu (Data Minimization)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo quy định của Luật Trẻ em Việt Nam và các tiêu chuẩn quốc tế (COPPA, GDPR-K), EDUNOVA áp dụng nghiêm ngặt nguyên tắc chỉ thu thập những thông tin thực sự cần thiết cho tiến trình học tập:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
              <li>
                <strong>Dữ liệu được lưu trữ:</strong> Mã định danh học sinh ẩn danh (UID ngẫu nhiên), điểm số các bài luyện tập toán học, tiến độ hoàn thành các chủ đề lớp 4.
              </li>
              <li>
                <strong>Dữ liệu tuyệt đối KHÔNG thu thập:</strong> Số căn cước, số điện thoại cá nhân của trẻ em, định vị GPS vị trí theo thời gian thực, hình ảnh khuôn mặt, dữ liệu sinh trắc học hoặc thông tin tài chính gia đình.
              </li>
            </ul>
          </section>

          {/* Mục 2: An toàn khi tương tác với Trí tuệ nhân tạo */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              2. Không đưa dữ liệu định danh của trẻ vào Prompt AI (Nguyên tắc 9)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nhằm ngăn ngừa triệt để rủi ro rò rỉ dữ liệu qua các mô hình ngôn ngữ lớn (LLM):
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>
                • <strong>Cơ chế Proxy Server kiểm duyệt:</strong> Toàn bộ câu hỏi của học sinh được lọc sạch thông tin cá nhân tại tầng backend trước khi chuyển tiếp tới API Gemini.
              </p>
              <p>
                • <strong>Không huấn luyện lại:</strong> Dữ liệu hội thoại giải toán lớp 4 không được dùng để huấn luyện hay tái định hình mô hình công khai.
              </p>
            </div>
          </section>

          {/* Mục 3: Quyền hạn của Phụ huynh & Nhà trường */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              3. Quyền của Phụ huynh và Người giám hộ hợp pháp
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Phụ huynh có toàn quyền:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
              <li>Xem xét toàn bộ lịch sử luyện tập và tương tác học tập của con em mình.</li>
              <li>Yêu cầu xóa vĩnh viễn tài khoản và toàn bộ bản ghi dữ liệu liên quan khỏi cơ sở dữ liệu.</li>
              <li>Từ chối bất kỳ tính năng tương tác ngoại vi nào mà phụ huynh cảm thấy không phù hợp.</li>
            </ul>
          </section>

          {/* Mục 4: Quy tắc bảo mật CSDL */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              4. Bảo mật CSDL và Phân quyền cấp máy chủ
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quyền xem và cập nhật dữ liệu được thực thi bằng quy tắc bảo mật CSDL (Firestore Security Rules / Backend RBAC) chứ không phụ thuộc vào việc ẩn/hiện nút trên giao diện người dùng.
            </p>
          </section>

          {/* Chân trang tài liệu */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Cần hỗ trợ về quyền riêng tư? Liên hệ: privacy@edunova.edu.vn
            </span>
            <Button
              variant="outline"
              size="sm"
              isUnimplemented={true}
              onUnimplementedClick={() =>
                onOpenUnimplemented('Tải bản dự thảo PDF chính sách quyền riêng tư')
              }
            >
              Tải bản PDF dự thảo
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
