/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Logo } from './Logo.tsx';
import { NavigationTarget } from '../../types/index.ts';
import { Mail, Phone, MapPin, Shield, FileText, ExternalLink } from 'lucide-react';

export interface FooterProps {
  onNavigate: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenUnimplemented }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              <Logo size="md" subtitleText="Nền tảng Giáo dục Thông minh" className="brightness-110 invert-[0.1]" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              &ldquo;Đổi mới cách học – Bứt phá tri thức&rdquo;
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              EDUNOVA ứng dụng trí tuệ nhân tạo để kết nối giáo viên, học sinh và nhà trường; hỗ trợ cá nhân hóa học tập, phát triển năng lực và lan tỏa những phương pháp giáo dục sáng tạo.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Sản phẩm khởi đầu: <span className="text-sky-400 font-semibold">EDUNOVA – Vui học Toán 4</span> (sẵn sàng mở rộng đa môn, đa khối lớp).
            </div>
          </div>

          {/* Cột 2: Sản phẩm & Chương trình */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Chương trình đào tạo
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('math4')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Toán 4: Số và phép tính
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('math4')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Toán 4: Hình học & Đo lường
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('math4')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Toán 4: Thống kê & Xác suất
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('math4')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Hoạt động trải nghiệm Toán 4
                </button>
              </li>
              <li className="pt-2 text-slate-500 italic">
                Các khối lớp khác: <span className="text-slate-400">Đang chuẩn bị</span>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ & Pháp lý */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Quy chuẩn & Pháp lý
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Chính sách quyền riêng tư</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guide')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Hướng dẫn sử dụng</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenUnimplemented('Quy chế vận hành nền tảng (Bản ký số)')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Quy chế vận hành
                  <span className="ml-1 text-[10px] text-slate-500">(Chưa ban hành)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenUnimplemented('Tiêu chuẩn sư phạm AI EDUNOVA')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Nguyên tắc đạo đức AI
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ & Hỗ trợ kỹ thuật */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Liên hệ kỹ thuật
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>support@edunova.edu.vn</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Hotline: (024) 8888 66xx</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Trung tâm Nghiên cứu & Phát triển Công nghệ Giáo dục</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dòng cuối bản quyền & tuyên bố minh bạch */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 EDUNOVA EdTech. Bản quyền thuộc về Đội ngũ Phát triển Nền tảng Giáo dục Thông minh EDUNOVA.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Tuân thủ Khung bảo vệ dữ liệu học sinh</span>
            <span>·</span>
            <span className="text-slate-500">Phiên bản Giai đoạn 1 (Khung & Giao diện)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
