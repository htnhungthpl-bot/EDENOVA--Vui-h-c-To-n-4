/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { CurriculumLessonItem } from '../types/curriculum.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  BookOpen,
  History,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ContentItem {
  id: string;
  topicCode: string;
  title: string;
  version: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewedBy?: string;
  comments?: string;
  updatedAt: string;
}

export interface ContentReviewerDashboardProps {
  onSelectLesson?: (lessonId: string) => void;
}

export const ContentReviewerDashboard: React.FC<ContentReviewerDashboardProps> = ({
  onSelectLesson,
}) => {
  const { session } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [lessons, setLessons] = useState<CurriculumLessonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.token}` };
      const [resContent, resLessons] = await Promise.all([
        fetch('/api/content/pending', { headers }),
        fetch('/api/curriculum/lessons', { headers }),
      ]);

      const dataContent = await resContent.json();
      if (resContent.ok) {
        setItems(dataContent.items || []);
      }

      const dataLessons = await resLessons.json();
      if (resLessons.ok) {
        setLessons(dataLessons.lessons || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [session]);

  const handleLessonReview = async (lessonId: string, action: 'APPROVE' | 'REJECT') => {
    if (!session) return;
    try {
      const res = await fetch('/api/curriculum/review-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          lessonId,
          action,
          reason: action === 'APPROVE' ? 'Nội dung đạt chuẩn GDPT 2018' : 'Yêu cầu điều chỉnh ví dụ',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(data.message);
        fetchItems();
      } else {
        setError(data.error || 'Lỗi thẩm định');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  const detailedLessons = lessons.filter((l) => l.isDetailed || l.positionNumber <= 3);

  return (
    <div className="space-y-6">
      {/* Banner Thẩm định viên */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-900 to-[#0F294A] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 text-xs font-medium mb-2">
            <FileCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Phân hệ Thẩm định Sư phạm (CONTENT_REVIEWER)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Kiểm duyệt Nội dung & Quản lý Phiên bản Toán 4
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            Đảm bảo 100% học liệu bám sát yêu cầu cần đạt của Chương trình GDPT 2018; kiểm soát tính sư phạm, ngôn ngữ và độ chính xác toán học trước khi cho phép giáo viên giao bài.
          </p>
        </div>

        <div className="text-xs text-amber-200 bg-white/10 p-3 rounded-xl border border-white/10">
          <div>Người thẩm định: <strong>{session?.name}</strong></div>
          <div className="text-[11px] text-amber-300 mt-0.5">{session?.email}</div>
        </div>
      </div>

      {actionMessage && (
        <Alert type="success" onDismiss={() => setActionMessage(null)}>
          {actionMessage}
        </Alert>
      )}

      {error && (
        <Alert type="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* THẨM ĐỊNH 3 BÀI HỌC LÀM SÂU TOÁN 4 */}
      <Card>
        <CardHeader
          title="Thẩm định 3 Bài học Toán 4 làm sâu"
          subtitle="Giáo viên chỉ có thể phát hành bài tập cho học sinh sau khi bạn bấm Phê duyệt"
          action={
            <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
              Làm mới
            </Button>
          }
        />

        <div className="pt-4 divide-y divide-slate-100">
          {detailedLessons.map((l) => (
            <div
              key={l.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {l.title}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      l.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {l.statusLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {l.notes || 'Soạn nháp theo chuẩn GDPT 2018.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onSelectLesson && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<BookOpen className="w-3.5 h-3.5" />}
                    onClick={() => onSelectLesson(l.id)}
                  >
                    Xem 9 phần
                  </Button>
                )}

                {l.status !== 'APPROVED' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleLessonReview(l.id, 'APPROVE')}
                  >
                    Phê duyệt
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    className="hover:border-rose-300 hover:bg-rose-50"
                    onClick={() => handleLessonReview(l.id, 'REJECT')}
                  >
                    Rút duyệt
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* DANH SÁCH HỌC LIỆU BẢN THẢO VÀ PHIÊN BẢN */}
      <Card>
        <CardHeader
          title="Ngân hàng học liệu & Quản lý phiên bản"
          subtitle="Danh sách học liệu dạng chuyên đề đang thẩm định"
        />

        <div className="pt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Mạch: {item.topicCode}
                  </span>
                  <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    v{item.version}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Trạng thái: <strong className="text-slate-700">{item.status}</strong></span>
                  <span>·</span>
                  <span>Cập nhật: {new Date(item.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Đã thẩm định
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
