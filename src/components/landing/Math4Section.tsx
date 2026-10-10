/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { MathTopic } from '../../types/index.ts';
import {
  Hash,
  Shapes,
  BarChart2,
  Compass,
  ArrowRight,
  BookCheck,
  AlertCircle,
} from 'lucide-react';

export interface Math4SectionProps {
  onGoToStudentDashboard: () => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const Math4Section: React.FC<Math4SectionProps> = ({
  onGoToStudentDashboard,
  onOpenUnimplemented,
}) => {
  const topics: Array<MathTopic & { icon: React.ReactNode; previewPoints: string[] }> = [
    {
      id: 'topic-1',
      title: '1. Số và Phép tính',
      code: 'TOAN4-C1',
      description:
        'Cấu tạo số tự nhiên đến lớp triệu, 4 phép tính cơ bản; Khái niệm ban đầu về phân số và các phép tính với phân số.',
      standardReference: 'Yêu cầu cần đạt: GDPT 2018 - Toán 4',
      lessonsCount: 0,
      exerciseCount: 0,
      status: 'draft',
      icon: <Hash className="w-5 h-5 text-sky-600" />,
      previewPoints: [
        'Số tự nhiên và lớp triệu',
        'Các phép tính cộng, trừ, nhân, chia với số tự nhiên',
        'Khái niệm phân số, phân số bằng nhau, rút gọn & quy đồng',
        'Cộng, trừ, nhân, chia phân số cơ bản',
      ],
    },
    {
      id: 'topic-2',
      title: '2. Hình học và Đo lường',
      code: 'TOAN4-C2',
      description:
        'Nhận biết góc nhọn, góc tù, góc bẹt; hai đường thẳng vuông góc, song song; đơn vị đo diện tích (dm², m², mm²) và thời gian.',
      standardReference: 'Yêu cầu cần đạt: GDPT 2018 - Toán 4',
      lessonsCount: 0,
      exerciseCount: 0,
      status: 'draft',
      icon: <Shapes className="w-5 h-5 text-teal-600" />,
      previewPoints: [
        'Góc nhọn, góc tù, góc bẹt và ứng dụng ê-ke',
        'Hai đường thẳng vuông góc và hai đường thẳng song song',
        'Hình bình hành, hình thoi và diện tích',
        'Đơn vị đo diện tích: dm², m², mm² và thế kỉ',
      ],
    },
    {
      id: 'topic-3',
      title: '3. Thống kê và Xác suất',
      code: 'TOAN4-C3',
      description:
        'Thu thập, phân loại, sắp xếp các số liệu; Đọc và biểu diễn dữ liệu trên biểu đồ cột; Khả năng xảy ra của một sự kiện.',
      standardReference: 'Yêu cầu cần đạt: GDPT 2018 - Toán 4',
      lessonsCount: 0,
      exerciseCount: 0,
      status: 'draft',
      icon: <BarChart2 className="w-5 h-5 text-indigo-600" />,
      previewPoints: [
        'Dãy số liệu thống kê đơn giản',
        'Làm quen và đọc thông tin từ biểu đồ cột',
        'Khả năng xảy ra của một sự kiện (Có thể, Chắc chắn, Không thể)',
      ],
    },
    {
      id: 'topic-4',
      title: '4. Hoạt động Thực hành & Trải nghiệm',
      code: 'TOAN4-C4',
      description:
        'Vận dụng kiến thức toán học giải quyết vấn đề thực tế: đo đạc, tính toán chi tiêu đơn giản, trò chơi toán học logic.',
      standardReference: 'Yêu cầu cần đạt: GDPT 2018 - Toán 4',
      lessonsCount: 0,
      exerciseCount: 0,
      status: 'draft',
      icon: <Compass className="w-5 h-5 text-amber-600" />,
      previewPoints: [
        'Thực hành đo đạc kích thước khuôn viên trường lớp',
        'Trải nghiệm ước lượng chi phí và mua sắm đơn giản',
        'Giải đố toán học phát triển tư duy logic',
      ],
    },
  ];

  return (
    <section id="math4-section" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Phân hệ chuyên biệt
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Toán tiểu học</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
              EDUNOVA – Vui học Toán 4
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Khung kiến thức chuẩn hóa theo 4 mạch nội dung của Chương trình Giáo dục Phổ thông 2018. Mọi câu hỏi có đáp án xác định sẽ được chấm độc lập theo quy tắc logic, kết hợp trợ giảng AI giải thích gợi mở.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={onGoToStudentDashboard}
            >
              Mở không gian Học sinh
            </Button>
          </div>
        </div>

        {/* Thông báo trạng thái nội dung (Nguyên tắc 6) */}
        <div className="mb-8 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">Thông báo về dữ liệu bài học:</strong> Dưới đây là khung chuẩn 4 mạch kiến thức theo chương trình. Ngân hàng câu hỏi chính thức và học liệu số đang được thẩm định sư phạm trước khi nạp vào cơ sở dữ liệu ở các giai đoạn sau; hệ thống không tự ý bịa đặt nội dung sách giáo khoa.
          </div>
        </div>

        {/* Lưới 4 chủ đề môn học */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((topic) => (
            <Card key={topic.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                      {topic.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{topic.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{topic.code}</span>
                        <span>·</span>
                        <span>{topic.standardReference}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Khung chuẩn hóa
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{topic.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-700">Nội dung cốt lõi:</p>
                  <ul className="space-y-1">
                    {topic.previewPoints.map((point, idx) => (
                      <li key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Ngân hàng đề: <strong>Chưa có dữ liệu bài làm</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  isUnimplemented={true}
                  onUnimplementedClick={() =>
                    onOpenUnimplemented(`Ngân hàng bài tập: ${topic.title}`)
                  }
                >
                  Xem bài tập mẫu
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
