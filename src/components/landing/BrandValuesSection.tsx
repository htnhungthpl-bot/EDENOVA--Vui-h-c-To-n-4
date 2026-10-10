/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../ui/Card.tsx';
import { UserCheck, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';

export const BrandValuesSection: React.FC = () => {
  const values = [
    {
      audience: 'Dành cho Giáo viên',
      icon: <UserCheck className="w-6 h-6 text-emerald-600" />,
      colorClass: 'border-t-4 border-t-emerald-500',
      summary: 'Giải phóng thời gian sự vụ, hỗ trợ sư phạm sáng tạo',
      points: [
        'Giảm tải áp lực chấm chữa các bài tập có quy tắc xác định nhờ hệ thống đối soát tự động.',
        'Nhận báo cáo trực quan về mức độ nắm vững từng đơn vị kiến thức của từng học sinh trong lớp.',
        'Ngân hàng học liệu và đề bài linh hoạt, dễ dàng phân hóa theo năng lực người học.',
        'Nhận đề xuất sư phạm từ AI để điều chỉnh kế hoạch bài dạy phù hợp thực tế.',
      ],
    },
    {
      audience: 'Dành cho Học sinh',
      icon: <GraduationCap className="w-6 h-6 text-sky-600" />,
      colorClass: 'border-t-4 border-t-sky-500',
      summary: 'Học tập không áp lực, gợi mở tư duy tự chủ',
      points: [
        'Luyện tập theo tốc độ riêng của bản thân; không bị so sánh áp đặt thành tích.',
        'Trợ giảng AI Socratic hướng dẫn từng bước nhỏ khi gặp khó, tuyệt đối không làm hộ bài.',
        'Giao diện trực quan, màu sắc sinh động, thân thiện với lứa tuổi tiểu học.',
        'Hệ thống phản hồi tức thì giúp học sinh nhận diện lỗi sai ngay sau khi làm xong.',
      ],
    },
    {
      audience: 'Dành cho Nhà trường',
      icon: <Building2 className="w-6 h-6 text-[#0F294A]" />,
      colorClass: 'border-t-4 border-t-[#0F294A]',
      summary: 'Dữ liệu chuẩn hóa, nâng cao chất lượng giáo dục đồng bộ',
      points: [
        'Theo dõi tiến độ thực hiện chương trình môn học theo thời gian thực một cách minh bạch.',
        'Đánh giá chất lượng dạy và học dựa trên năng lực thực chất, loại bỏ bệnh thành tích.',
        'Dễ dàng mở rộng từ 1 môn thí điểm sang toàn khối, toàn cấp học mà không cần đập đi xây lại.',
        'Đảm bảo chuẩn an toàn thông tin, bảo mật tuyệt đối hồ sơ và dữ liệu học sinh.',
      ],
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-2">
            Giá trị cốt lõi
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
            Đồng hành cùng 3 trụ cột giáo dục
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            EDUNOVA tạo ra hệ sinh thái gắn kết chặt chẽ giữa nhà trường, thầy cô và các em học sinh trên nền tảng công nghệ sư phạm minh bạch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {values.map((item, idx) => (
            <Card key={idx} className={`flex flex-col justify-between ${item.colorClass}`}>
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-900">{item.audience}</h4>
                <p className="text-xs font-medium text-slate-500 mt-1 mb-5">{item.summary}</p>
                <ul className="space-y-3">
                  {item.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 italic">
                * Thiết kế dựa trên khảo sát nhu cầu sư phạm thực tế
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
