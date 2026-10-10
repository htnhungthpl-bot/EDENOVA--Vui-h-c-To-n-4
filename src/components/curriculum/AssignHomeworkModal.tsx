/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { CurriculumLessonItem } from '../../types/curriculum.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Send, Calendar, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface AssignHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assignment: any) => void;
  defaultClassId?: string;
}

export const AssignHomeworkModal: React.FC<AssignHomeworkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultClassId = 'school_alpha_4A',
}) => {
  const { session } = useAuth();
  const [lessons, setLessons] = useState<CurriculumLessonItem[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [classId, setClassId] = useState<string>(defaultClassId);
  const [title, setTitle] = useState<string>('Bài tập tuần: Vui học Toán 4');
  const [instructions, setInstructions] = useState<string>('Em hãy đọc kỹ đề và tính toán cẩn thận.');
  
  // Deadline mặc định: 7 ngày sau
  const defaultDeadline = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const [deadlineDate, setDeadlineDate] = useState<string>(defaultDeadline);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLessons = async () => {
      try {
        const headers: HeadersInit = {};
        if (session?.token) {
          headers['Authorization'] = `Bearer ${session.token}`;
        }
        const res = await fetch('/api/curriculum/lessons', { headers });
        const data = await res.json();
        if (data.success) {
          setLessons(data.lessons || []);
          // Chọn bài đầu tiên đã duyệt nếu có
          const firstApproved = (data.lessons || []).find((l: any) => l.status === 'APPROVED');
          if (firstApproved) {
            setSelectedLessonId(firstApproved.id);
            setTitle(`Bài tập: ${firstApproved.title.split('(')[0]}`);
          } else if (data.lessons?.length > 0) {
            setSelectedLessonId(data.lessons[0].id);
          }
        }
      } catch (err) {
        console.error('Lỗi nạp bài học:', err);
      }
    };

    fetchLessons();
  }, [isOpen, session]);

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const isApproved = selectedLesson?.status === 'APPROVED';

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError(null);

    if (!selectedLessonId) {
      setError('Vui lòng chọn bài học cần giao.');
      return;
    }

    if (!isApproved) {
      setError(
        `Ràng buộc sư phạm: Bài học [${selectedLesson?.title}] đang ở trạng thái [${selectedLesson?.statusLabel}]. Chỉ nội dung ĐÃ DUYỆT (APPROVED) bởi Thẩm định viên mới được phép giao cho học sinh.`
      );
      return;
    }

    setLoading(true);
    try {
      const deadlineISO = new Date(`${deadlineDate}T23:59:59`).toISOString();
      const res = await fetch('/api/curriculum/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          classId,
          lessonId: selectedLessonId,
          title,
          instructions,
          deadline: deadlineISO,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.assignment);
        onClose();
      } else {
        setError(data.error || 'Lỗi giao bài tập');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Giao bài tập về nhà cho lớp"
      description="Chỉ những bài học đã được CONTENT_REVIEWER phê duyệt mới đủ điều kiện giao cho học sinh."
      maxWidth="md"
    >
      <form onSubmit={handleAssign} className="space-y-4 text-xs">
        {error && <Alert type="error" onDismiss={() => setError(null)}>{error}</Alert>}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Lớp học tiếp nhận bài
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="school_alpha_4A">Lớp 4A (Trường Tiểu học Alpha)</option>
            <option value="school_alpha_4B">Lớp 4B (Trường Tiểu học Alpha)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Chọn bài học trong chương trình Toán 4
          </label>
          <select
            value={selectedLessonId}
            onChange={(e) => {
              setSelectedLessonId(e.target.value);
              const found = lessons.find((l) => l.id === e.target.value);
              if (found) {
                setTitle(`Bài tập: ${found.title.split('(')[0]}`);
              }
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                #{l.positionNumber} - {l.title} [{l.statusLabel}]
              </option>
            ))}
          </select>

          {/* Cảnh báo trạng thái phê duyệt */}
          {selectedLesson && (
            <div className="mt-2 p-2.5 rounded-lg border text-[11px] flex items-start gap-2">
              {isApproved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-emerald-800">
                    Bài học này <strong>ĐÃ DUYỆT</strong>. Đủ điều kiện sư phạm để giao cho học sinh làm bài và chấm điểm quy tắc.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-amber-800">
                    Bài học đang ở trạng thái <strong>[{selectedLesson.statusLabel}]</strong>. Theo quy tắc Giai đoạn 4, bạn cần đăng nhập tài khoản Thẩm định viên để duyệt bài này trước khi giao.
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Tiêu đề bài tập
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Lời dặn của giáo viên (Hướng dẫn sư phạm)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Hạn chót nộp bài (Deadline)
          </label>
          <div className="relative">
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            * Sau mốc thời gian này, hệ thống sẽ tự động khóa và từ chối nhận bài làm mới (HTTP 400).
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={loading || !isApproved}
            icon={<Send className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? 'Đang giao bài...' : 'Phát hành bài tập'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
