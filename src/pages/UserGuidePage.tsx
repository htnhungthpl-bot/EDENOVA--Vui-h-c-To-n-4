/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { NavigationTarget } from '../types/index.ts';
import {
  BookOpen,
  ArrowLeft,
  GraduationCap,
  UserCheck,
  Building2,
  HeartHandshake,
  Bot,
  HelpCircle,
} from 'lucide-react';

export interface UserGuidePageProps {
  onNavigate: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const UserGuidePage: React.FC<UserGuidePageProps> = ({
  onNavigate,
  onOpenUnimplemented,
}) => {
  return (
    <div className="py-10 sm:py-16 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
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

        {/* Cảnh báo: Tài liệu dự thảo */}
        <Alert
          type="info"
          title="Tài liệu dự thảo vận hành (Bản đầu - Đang trong quá trình hoàn thiện)"
          className="mb-8"
        >
          Hướng dẫn dưới đây cung cấp quy trình vận hành dự kiến cho các đối tượng người dùng của hệ thống EDUNOVA. Tài liệu này sẽ được chuẩn hóa thành sổ tay hướng dẫn chi tiết kèm video minh họa khi các chức năng kết nối máy chủ hoàn thành.
        </Alert>

        <Card className="space-y-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Sổ tay Hướng dẫn Vận hành</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
              Hướng dẫn Sử dụng Nền tảng EDUNOVA
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Áp dụng cho Phân hệ khởi đầu: EDUNOVA – Vui học Toán 4
            </p>
          </div>

          {/* Phần 1: Dành cho Học sinh */}
          <section className="space-y-3 p-4 rounded-xl bg-sky-50/50 border border-sky-100">
            <h2 className="text-sm font-bold text-[#0F294A] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              1. Hướng dẫn dành cho Học sinh Lớp 4
            </h2>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Vào góc học tập:</strong> Nhấn chọn vai trò &ldquo;Học sinh lớp 4&rdquo; hoặc liên kết mã lớp do giáo viên cung cấp.
              </li>
              <li>
                <strong>Lựa chọn chủ đề toán học:</strong> Bấm vào một trong 4 mạch kiến thức (Số & Phép tính, Hình học, Thống kê, Trải nghiệm).
              </li>
              <li>
                <strong>Tương tác với Trợ giảng AI:</strong> Khi chưa hiểu đề bài, nhấn vào biểu tượng Trợ giảng AI và đặt câu hỏi. Hãy đọc kỹ gợi ý và tự tính toán từng bước để ghi nhớ lâu hơn.
              </li>
              <li>
                <strong>Nộp bài:</strong> Hệ thống kiểm tra kết quả ngay lập tức và đưa ra phân tích cách giải.
              </li>
            </ul>
          </section>

          {/* Phần 2: Dành cho Giáo viên */}
          <section className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              2. Hướng dẫn dành cho Giáo viên bộ môn
            </h2>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Khởi tạo và quản lý lớp học:</strong> Tạo danh sách lớp theo khối 4, nhận mã lớp để cấp cho học sinh tham gia.
              </li>
              <li>
                <strong>Giao bài tập thích ứng:</strong> Chọn các bộ câu hỏi từ ngân hàng chuẩn hóa GDPT 2018 hoặc tự soạn câu hỏi mới.
              </li>
              <li>
                <strong>Xem báo cáo chẩn đoán:</strong> Bảng tổng hợp tự động hiển thị tỷ lệ học sinh đạt chuẩn từng kỹ năng toán học, giúp thầy cô điều chỉnh giáo án kịp thời.
              </li>
            </ul>
          </section>

          {/* Phần 3: Dành cho Phụ huynh */}
          <section className="space-y-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-700" />
              3. Hướng dẫn dành cho Phụ huynh học sinh
            </h2>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Theo dõi không tạo áp lực:</strong> Xem lịch sử hoàn thành bài học của con; nhận khuyến nghị sư phạm tích cực từ hệ thống.
              </li>
              <li>
                <strong>Gợi ý trò chuyện cùng con:</strong> Ứng dụng cung cấp các câu hỏi gợi mở để bố mẹ cùng con thảo luận về các bài toán thực tế đời sống.
              </li>
            </ul>
          </section>

          {/* Phần 4: Dành cho Ban giám hiệu */}
          <section className="space-y-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
            <h2 className="text-sm font-bold text-purple-950 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-700" />
              4. Hướng dẫn dành cho Nhà trường & Quản trị viên
            </h2>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Phân quyền giáo viên:</strong> Phê duyệt tài khoản giáo viên phụ trách từng lớp.
              </li>
              <li>
                <strong>Kiểm toán an toàn dữ liệu:</strong> Giám sát việc tuân thủ bảo mật thông tin học sinh theo quy chế nhà trường.
              </li>
            </ul>
          </section>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Có thắc mắc kỹ thuật? Liên hệ ban sư phạm: <strong>hotro@edunova.edu.vn</strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              isUnimplemented={true}
              onUnimplementedClick={() =>
                onOpenUnimplemented('Tải cẩm nang hướng dẫn sử dụng dạng PDF')
              }
            >
              Tải tài liệu dạng PDF
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
