/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../ui/Card.tsx';
import { UserPlus, Compass, PenTool, TrendingUp } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Đăng ký & Chọn vai trò',
      description:
        'Nhà trường, giáo viên hoặc phụ huynh đăng ký tài khoản. Hệ thống phân bổ giao diện và quyền truy cập chuẩn xác theo từng nhóm đối tượng.',
      icon: <UserPlus className="w-5 h-5 text-sky-600" />,
    },
    {
      stepNumber: '02',
      title: 'Xây dựng & Phân bổ lộ trình',
      description:
        'Giáo viên lựa chọn mạch kiến thức Toán 4 từ ngân hàng chuẩn hóa hoặc tạo bài tập riêng; giao việc học tập theo từng nhóm năng lực học sinh.',
      icon: <Compass className="w-5 h-5 text-teal-600" />,
    },
    {
      stepNumber: '03',
      title: 'Luyện tập & Tương tác Socratic',
      description:
        'Học sinh thực hiện bài làm. Nếu gặp khó khăn, Trợ giảng AI sẽ đưa ra câu hỏi định hướng từng bước. Câu hỏi trắc nghiệm/số được chấm tự động.',
      icon: <PenTool className="w-5 h-5 text-amber-600" />,
    },
    {
      stepNumber: '04',
      title: 'Đánh giá & Đồng hành tiến bộ',
      description:
        'Hệ thống tổng hợp báo cáo năng lực. Giáo viên và phụ huynh nắm bắt điểm mạnh, điểm cần hỗ trợ của học sinh để đồng hành kịp thời.',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-2">
            Quy trình triển khai
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
            4 bước ứng dụng EDUNOVA trong giảng dạy
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Quy trình được tối ưu hóa nhằm giảm thiểu thủ tục hành chính, tối đa hóa thời gian tương tác giáo dục thực chất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <Card key={idx} className="relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    {st.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-200 tracking-tighter">
                    {st.stepNumber}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{st.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{st.description}</p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Giai đoạn {idx + 1} của chu trình học tập
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
