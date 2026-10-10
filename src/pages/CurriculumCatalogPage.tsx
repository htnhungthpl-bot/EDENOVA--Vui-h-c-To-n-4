/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { CurriculumLessonItem, LessonReviewStatus } from '../types/curriculum.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  UploadCloud,
  FileText,
} from 'lucide-react';

export interface CurriculumCatalogPageProps {
  onSelectLesson: (lessonId: string) => void;
  onBack?: () => void;
}

export const CurriculumCatalogPage: React.FC<CurriculumCatalogPageProps> = ({
  onSelectLesson,
  onBack,
}) => {
  const { session } = useAuth();
  const [lessons, setLessons] = useState<CurriculumLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrand, setSelectedStrand] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedVolume, setSelectedVolume] = useState<'ALL' | 1 | 2>('ALL');

  // Modal đối chiếu danh mục
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  const isReviewerOrAdmin = session?.role === 'CONTENT_REVIEWER' || session?.role === 'SUPER_ADMIN';

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch('/api/curriculum/lessons', { headers });
      const data = await res.json();
      if (data.success) {
        setLessons(data.lessons || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [session]);

  const handleImportSubmit = async () => {
    if (!importText.trim()) {
      setImportError('Vui lòng dán danh sách phân phối chương trình vào ô bên dưới.');
      return;
    }

    setImportError(null);
    setImportSuccess(null);
    setIsSubmittingImport(true);

    try {
      // Hỗ trợ phân tích cả định dạng dòng ("1. Ôn tập..." hoặc "Bài 1: ...") lẫn định dạng JSON
      const lines = importText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const itemsToImport: Array<{ positionNumber: number; title: string; strandCode?: string; notes?: string }> = [];

      // Kiểm tra nếu là JSON
      if (importText.trim().startsWith('[') && importText.trim().endsWith(']')) {
        const parsed = JSON.parse(importText.trim());
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            itemsToImport.push({
              positionNumber: item.positionNumber || item.position || 0,
              title: item.title || item.name || '',
              strandCode: item.strandCode,
              notes: item.notes,
            });
          }
        }
      } else {
        // Phân tích dòng văn bản
        let autoPos = 1;
        for (const line of lines) {
          // Thử tìm số bài ở đầu: "Bài 4: ..." hoặc "4. ..." hoặc "4 - ..."
          const match = line.match(/^(?:Bài\s*)?(\d+)[\.:\-\)]?\s*(.*)$/i);
          if (match) {
            const posNum = parseInt(match[1], 10);
            const titlePart = match[2].trim();
            itemsToImport.push({
              positionNumber: posNum,
              title: titlePart.startsWith('Bài') ? titlePart : `Bài ${posNum}: ${titlePart}`,
            });
          } else {
            itemsToImport.push({
              positionNumber: autoPos,
              title: line.startsWith('Bài') ? line : `Bài ${autoPos}: ${line}`,
            });
          }
          autoPos++;
        }
      }

      if (itemsToImport.length === 0) {
        throw new Error('Không phân tích được danh sách bài học hợp lệ từ nội dung đã nhập.');
      }

      const res = await fetch('/api/curriculum/import-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ items: itemsToImport }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi gửi dữ liệu lên máy chủ.');
      }

      setImportSuccess(data.message || `Đã cập nhật thành công ${itemsToImport.length} bài học!`);
      fetchLessons();
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportText('');
        setImportSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Lỗi xử lý đối chiếu danh mục.');
    } finally {
      setIsSubmittingImport(false);
    }
  };

  const strands = [
    { code: 'ALL', name: 'Tất cả mạch kiến thức' },
    { code: 'TOAN4-C1', name: 'Số và phép tính' },
    { code: 'TOAN4-C2', name: 'Hình học & Đo lường' },
    { code: 'TOAN4-C3', name: 'Thống kê & Xác suất' },
    { code: 'TOAN4-C4', name: 'Phân số & Ôn tập' },
  ];

  const statuses = [
    { code: 'ALL', name: 'Tất cả trạng thái' },
    { code: 'APPROVED', name: 'Đã duyệt' },
    { code: 'PENDING_REVIEW', name: 'Chờ duyệt' },
    { code: 'DRAFT', name: 'Đã đối chiếu SGK' },
    { code: 'UNVERIFIED', name: 'Chưa đối chiếu' },
  ];

  const filteredLessons = lessons.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `Bài ${l.positionNumber}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.topicTitle && l.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStrand = selectedStrand === 'ALL' || l.strandCode === selectedStrand;
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    const matchesVolume = selectedVolume === 'ALL' || l.bookVolume === selectedVolume;
    return matchesSearch && matchesStrand && matchesStatus && matchesVolume;
  });

  const getStatusBadge = (status: LessonReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã duyệt
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Chờ duyệt
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            Đã đối chiếu SGK
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Chưa đối chiếu
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F294A] to-sky-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Phân phối chương trình chuẩn SGK Toán 4 (KNTT)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Danh mục 73 Bài học Toán lớp 4 (SGK Kết nối tri thức)
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            Hệ thống đã đồng bộ chuẩn xác 100% 73 bài học theo sách giáo khoa Toán 4 (Tập 1 & Tập 2, NXB Giáo dục Việt Nam) do thầy cô cung cấp. 3 bài đầu tiên đã biên soạn chi tiết 9 phần sư phạm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isReviewerOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0 inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 text-sky-300" />
              <span>Đối chiếu / Nhập 73 bài</span>
            </Button>
          )}

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0"
            >
              Quay lại
            </Button>
          )}
        </div>
      </div>

      {/* Thông báo chuẩn hóa phân phối chương trình SGK */}
      <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-950">Đã đối chiếu phân phối chương trình chính thức từ SGK:</p>
          <p className="text-emerald-800 leading-relaxed">
            • <strong>Tập 1 (Bài 1–37):</strong> 7 chủ đề (Ôn tập & Bổ sung, Góc & đơn vị đo góc, Số có nhiều chữ số, Một số đơn vị đo đại lượng, Phép cộng & trừ, Đường thẳng vuông góc & song song, Ôn tập HKI).<br />
            • <strong>Tập 2 (Bài 38–73):</strong> 6 chủ đề (Phép nhân & chia, Thống kê & xác suất, Phân số, Phép cộng & trừ phân số, Phép nhân & chia phân số, Ôn tập cuối năm).<br />
            • <strong>3 bài đầu tiên (Bài 1, Bài 2, Bài 3):</strong> Đã biên soạn chi tiết 9 phần sư phạm theo chuẩn GDPT 2018 (Bài 1: Ôn tập các số đến 100 000; Bài 2: Ôn tập các phép tính trong phạm vi 100 000; Bài 3: Số chẵn, số lẻ).
          </p>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <Card className="p-4 space-y-3">
        {/* Tab chọn tập sách */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-600 mr-2">Tập sách:</span>
          <button
            onClick={() => setSelectedVolume('ALL')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              selectedVolume === 'ALL'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả (73 bài)
          </button>
          <button
            onClick={() => setSelectedVolume(1)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              selectedVolume === 1
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tập 1 (Bài 1–37)
          </button>
          <button
            onClick={() => setSelectedVolume(2)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              selectedVolume === 2
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tập 2 (Bài 38–73)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số bài, tên bài, chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <select
              value={selectedStrand}
              onChange={(e) => setSelectedStrand(e.target.value)}
              aria-label="Chọn mạch kiến thức"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {strands.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Chọn trạng thái kiểm duyệt"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {statuses.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Danh sách 73 bài */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Đang nạp danh mục 73 bài học từ máy chủ...
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Không tìm thấy bài học phù hợp với điều kiện lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson) => {
            return (
              <Card
                key={lesson.id}
                className="p-4 transition-all flex flex-col justify-between hover:border-sky-400 hover:shadow-md cursor-pointer bg-white"
                onClick={() => onSelectLesson(lesson.id)}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Bài {lesson.positionNumber}
                    </span>
                    {getStatusBadge(lesson.status)}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {lesson.title}
                  </h3>

                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    {lesson.topicTitle && (
                      <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {lesson.topicTitle}
                      </span>
                    )}
                    {lesson.bookVolume && (
                      <span className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        Tập {lesson.bookVolume} • Tr.{lesson.page}
                      </span>
                    )}
                  </div>

                  {lesson.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {lesson.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {lesson.strandCode}
                  </span>

                  <span className="text-sky-600 font-medium inline-flex items-center gap-1 group-hover:text-sky-700">
                    {lesson.isDetailed ? 'Xem chi tiết sư phạm' : 'Xem thông tin bài'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Đối chiếu / Nhập danh mục 73 bài */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Đối chiếu & Nhập danh mục 73 Bài học Toán 4"
        description="Dán nội dung tài liệu phân phối chương trình chính thức để cập nhật nhanh chóng 73 khung vị trí."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isSubmittingImport}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImportSubmit}
              disabled={isSubmittingImport}
            >
              {isSubmittingImport ? 'Đang cập nhật...' : 'Cập nhật vào hệ thống'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Alert type="info" title="Hỗ trợ nhập linh hoạt">
            Bạn có thể dán danh sách theo dòng văn bản (Ví dụ: <em>"1. Ôn tập các số..."</em> hoặc <em>"Bài 1: Ôn tập..."</em>) hoặc mảng JSON. Hệ thống sẽ tự động ghép với 73 vị trí bài học.
          </Alert>

          {importError && (
            <Alert type="error" title="Lỗi cập nhật">
              {importError}
            </Alert>
          )}

          {importSuccess && (
            <Alert type="success" title="Thành công">
              {importSuccess}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung phân phối chương trình:
            </label>
            <textarea
              rows={12}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Ví dụ định dạng dán từ tài liệu:\n1. Ôn tập các số đến 100 000\n2. Ôn tập các phép tính trong phạm vi 100 000\n3. Biểu thức có chứa một chữ\n4. Các số có sáu chữ số\n5. Hàng và lớp\n...\n73. Ôn tập chung học kì 2`}
              className="w-full p-3 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
