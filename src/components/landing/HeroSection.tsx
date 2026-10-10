/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../ui/Button.tsx';
import { Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';

export interface HeroSectionProps {
  onExploreMath: () => void;
  onExploreRoles: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMath,
  onExploreRoles,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Slogan Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-900 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>&ldquo;Đổi mới cách học – Bứt phá tri thức&rdquo;</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F294A] tracking-tight leading-[1.15]">
            Nền tảng Giáo dục Thông minh{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-600">
              EDUNOVA
            </span>
          </h1>

          {/* Sứ mệnh & Thông điệp chính thức */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            EDUNOVA ứng dụng trí tuệ nhân tạo để kết nối giáo viên, học sinh và nhà trường; hỗ trợ cá nhân hóa học tập, phát triển năng lực và lan tỏa những phương pháp giáo dục sáng tạo.
          </p>

          {/* Thẻ nổi bật phân hệ khởi đầu */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs max-w-xl mx-auto text-left flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                  Sản phẩm khởi đầu
                </span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-xs text-slate-600">Khối Tiểu học</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                EDUNOVA – Vui học Toán 4
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Thiết kế bám sát khung Chương trình GDPT 2018, sẵn sàng mở rộng đa môn, đa khối lớp với kiến trúc module độc lập.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={onExploreMath}
              className="w-full sm:w-auto"
            >
              Khám phá Vui học Toán 4
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={<Layers className="w-4 h-4" />}
              onClick={onExploreRoles}
              className="w-full sm:w-auto"
            >
              Khung giao diện 4 vai trò
            </Button>
          </div>

          {/* Thông tin minh bạch */}
          <div className="text-xs text-slate-500 pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>• Minh bạch tiến độ kỹ thuật</span>
            <span>• Không sử dụng số liệu ảo</span>
            <span>• An toàn dữ liệu trẻ em</span>
          </div>
        </div>
      </div>
    </section>
  );
};
