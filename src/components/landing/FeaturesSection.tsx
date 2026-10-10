/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../ui/Card.tsx';
import {
  CheckSquare,
  Bot,
  ShieldCheck,
  BarChart3,
  Boxes,
  Zap,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Chấm điểm quy tắc xác định',
      description:
        'Các bài toán trắc nghiệm, điền số và tính toán được chấm bằng logic máy tính chuẩn xác, đảm bảo 100% khách quan, không phó mặc tính đúng sai cho AI sinh văn bản.',
      icon: <CheckSquare className="w-5 h-5 text-sky-600" />,
      tag: 'Chuẩn xác 100%',
    },
    {
      title: 'Trợ giảng AI Socratic sư phạm',
      description:
        'AI không giải hộ hay đọc ngay đáp số; hệ thống đặt câu hỏi gợi mở từng bước, phân tích manh mối giúp học sinh tự tìm ra cách giải bài toán.',
      icon: <Bot className="w-5 h-5 text-teal-600" />,
      tag: 'Phương pháp gợi mở',
    },
    {
      title: 'Bảo vệ quyền riêng tư & dữ liệu trẻ em',
      description:
        'Nguyên tắc thu thập tối thiểu. Không đưa thông tin định danh cá nhân (PII) của học sinh vào prompt AI. Quy tắc bảo mật CSDL cấp độ hàng.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      tag: 'An toàn bảo mật',
    },
    {
      title: 'Phân tích tiến trình năng lực',
      description:
        'Đo lường năng lực theo các thành phần chuẩn GDPT: Tư duy & lập luận toán học, Mô hình hóa toán học, Giải quyết vấn đề và Giao tiếp toán học.',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      tag: 'Chuẩn GDPT 2018',
    },
    {
      title: 'Phân quyền 4 vai trò độc lập (RBAC)',
      description:
        'Giao diện và quyền hạn tối ưu hóa riêng biệt cho Học sinh, Giáo viên, Ban giám hiệu nhà trường và Phụ huynh; kiểm soát bảo mật từ máy chủ.',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      tag: 'Kiểm soát truy cập',
    },
    {
      title: 'Kiến trúc Module mở rộng linh hoạt',
      description:
        'Bắt đầu với môn Toán lớp 4, nhưng nền tảng được thiết kế độc lập, sẵn sàng tiếp nhận thêm môn Tiếng Việt, Khoa học và các khối lớp khác.',
      icon: <Boxes className="w-5 h-5 text-[#0F294A]" />,
      tag: 'Mở rộng quy mô',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-2">
            Năng lực hệ thống
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
            Tính năng kỹ thuật & sư phạm vượt trội
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Kết hợp chặt chẽ giữa tính chuẩn xác của khoa học máy tính và sự thấu hiểu tâm lý học đường tiểu học.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <Card key={idx} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {feat.tag}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
