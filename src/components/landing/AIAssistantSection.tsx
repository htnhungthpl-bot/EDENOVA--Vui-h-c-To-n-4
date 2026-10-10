/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Bot, MessageSquare, ShieldCheck, HelpCircle, CheckCircle } from 'lucide-react';

export interface AIAssistantSectionProps {
  onOpenUnimplemented: (featureName: string) => void;
}

export const AIAssistantSection: React.FC<AIAssistantSectionProps> = ({
  onOpenUnimplemented,
}) => {
  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Cột giới thiệu nguyên lý AI */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Công nghệ sư phạm
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">Bảo vệ trẻ em</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight">
                Trợ giảng AI Sư phạm EDUNOVA
              </h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Khác biệt hoàn toàn với các chatbot sinh văn bản thông thường, Trợ giảng AI EDUNOVA được thiết kế riêng cho lứa tuổi học sinh lớp 4 với những nguyên tắc bảo vệ nghiêm ngặt.
              </p>
            </div>

            {/* 3 nguyên tắc sư phạm của AI */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Nguyên tắc Socratic: Tuyệt đối không làm hộ bài
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Khi học sinh hỏi &ldquo;Kết quả bài này là bao nhiêu?&rdquo;, AI không đưa ra đáp số cuối cùng. Thay vào đó, AI hỏi ngược lại: &ldquo;Em đã xác định được bài toán cho biết gì và hỏi gì chưa?&rdquo; nhằm kích thích khả năng suy luận độc lập.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Bảo mật tuyệt đối danh tính học sinh (COPPA/GDPR Compliance)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hệ thống chạy qua máy chủ proxy, lọc sạch mọi thông tin cá nhân (họ tên, trường lớp, địa chỉ) trước khi tương tác với API. Không lưu vết định danh học sinh vào mô hình AI.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Phân tách giữa Chấm điểm & Giải thích
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Chấm bài đúng/sai được thực hiện bằng bộ quy tắc toán học xác định 100%. AI chỉ đảm nhận vai trò phân tích phương pháp và gợi ý hướng đi khi học sinh làm sai.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                icon={<Bot className="w-4 h-4" />}
                isUnimplemented={true}
                onUnimplementedClick={() =>
                  onOpenUnimplemented('Phòng thử nghiệm Trợ giảng AI Sư phạm (Kết nối Gemini API Server)')
                }
              >
                Trải nghiệm thử nghiệm tương tác AI
              </Button>
            </div>
          </div>

          {/* Cột mô phỏng tương tác sư phạm chuẩn mực */}
          <div className="lg:col-span-5">
            <Card className="border-slate-300 shadow-md p-0 overflow-hidden">
              {/* Header khung chat mô phỏng */}
              <div className="bg-[#0F294A] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold">Trợ giảng AI EDUNOVA (Toán 4)</h5>
                    <span className="text-[10px] text-teal-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      Chế độ sư phạm Socratic
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                  Mô phỏng chuẩn
                </span>
              </div>

              {/* Nội dung hội thoại sư phạm mẫu */}
              <div className="p-4 space-y-3.5 bg-slate-50 text-xs">
                {/* Tin nhắn học sinh */}
                <div className="flex items-start gap-2 justify-end">
                  <div className="bg-sky-600 text-white p-3 rounded-xl rounded-tr-none max-w-[85%] leading-relaxed shadow-xs">
                    &ldquo;Thầy AI ơi, tính giúp em bài này với: Một mảnh vườn hình chữ nhật có chiều dài 24m, chiều rộng bằng 2/3 chiều dài. Diện tích là bao nhiêu?&rdquo;
                  </div>
                </div>

                {/* Phản hồi sư phạm chuẩn mực của AI */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0F294A] text-white flex items-center justify-center text-[10px] shrink-0 mt-1">
                    AI
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none max-w-[90%] text-slate-800 leading-relaxed shadow-xs space-y-2">
                    <p className="font-semibold text-[#0F294A]">
                      Chào em! Thầy sẽ cùng em khám phá từng bước nhé:
                    </p>
                    <p>
                      1. Để tính được <strong>diện tích hình chữ nhật</strong>, em cần biết những số đo nào?
                    </p>
                    <p>
                      2. Bài toán đã cho sẵn <strong>chiều dài là 24m</strong>. Còn chiều rộng bằng <strong>2/3 chiều dài</strong>. Em nhớ lại xem: muốn tìm 2/3 của 24, chúng ta lấy 24 nhân với phân số nào?
                    </p>
                    <div className="p-2 bg-sky-50 rounded border border-sky-100 text-[11px] text-sky-900 font-medium">
                      💡 Em hãy thử tính chiều rộng trước và nhắn lại cho thầy kiểm tra nhé!
                    </div>
                  </div>
                </div>
              </div>

              {/* Chân thẻ */}
              <div className="p-3 bg-white border-t border-slate-200 text-center text-[11px] text-slate-500">
                Học sinh tự tư duy & nhận diện phương pháp thay vì nhận sẵn đáp án.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
