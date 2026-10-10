/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { NavigationTarget } from '../types/index.ts';
import {
  HeartHandshake,
  UserPlus,
  BookOpen,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export interface ParentDashboardProps {
  onNavigate: (target: NavigationTarget) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onNavigate,
  onOpenUnimplemented,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950 to-[#0F294A] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 text-xs font-medium mb-2">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
            <span>Phân hệ Đồng hành Gia đình</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Góc Phụ huynh – Đồng hành cùng con học Toán 4
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            Theo dõi tiến trình tiếp thu toán học của con theo tinh thần động viên tích cực, nói không với áp lực điểm số.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="accent"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
            isUnimplemented={true}
            onUnimplementedClick={() =>
              onOpenUnimplemented('Liên kết tài khoản học sinh bằng mã định danh an toàn')
            }
          >
            Liên kết với con
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Tiến độ học tập của con"
              subtitle="Thông tin tổng hợp từ các bài làm thực tế"
            />
            <div className="pt-4">
              <EmptyState
                title="Chưa có dữ liệu liên kết học sinh"
                description="Phụ huynh chưa liên kết tài khoản với học sinh nào. Sau khi nhập mã liên kết an toàn do nhà trường hoặc học sinh cung cấp, toàn bộ nhật ký học tập sẽ xuất hiện tại đây."
                actionText="Nhập mã liên kết học sinh"
                isActionUnimplemented={true}
                onAction={() =>
                  onOpenUnimplemented('Nhập mã xác thực liên kết con em')
                }
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Gợi ý hoạt động Toán học tại nhà"
              subtitle="Khuyến nghị sư phạm gắn với cuộc sống thường ngày"
            />
            <div className="pt-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sky-950">Gợi ý tuần này: Đi siêu thị cùng con</h5>
                  <p className="text-slate-600 mt-1">
                    Khi đi siêu thị hoặc chợ, bố mẹ có thể nhờ con ước lượng tổng số tiền các món đồ (vận dụng kiến thức cộng trừ số tự nhiên đến hàng trăm nghìn).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-amber-950">Gợi ý: Tìm các góc trong ngôi nhà</h5>
                  <p className="text-slate-600 mt-1">
                    Cùng con tìm góc vuông (cửa sổ, bàn học), góc nhọn (cái kéo khi mở hé) và góc bẹt (khi xòe quạt) để củng cố hình học trực quan.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader
              title="Cẩm nang phụ huynh"
              subtitle="Tâm lý lứa tuổi học sinh lớp 4"
            />
            <div className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h5 className="font-semibold text-slate-800 mb-1">Đặc điểm nhận thức lớp 4:</h5>
                <p className="leading-relaxed">
                  Lớp 4 là giai đoạn bản lề: lượng kiến thức toán học trừu tượng hóa nhanh (xuất hiện phân số, triệu, diện tích lớn). Trẻ dễ nản nếu bị phê bình khi làm sai. Hãy khen ngợi sự kiên trì thay vì chỉ khen đáp số đúng.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                icon={<HelpCircle className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('guide')}
              >
                Xem cẩm nang chi tiết
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
