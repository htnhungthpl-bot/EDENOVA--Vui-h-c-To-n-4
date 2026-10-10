/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GamificationBadge, StageMilestone } from '../types/gamification.ts';

// -------------------------------------------------------------
// DANH MỤC HUY HIỆU SƯ PHẠM (KÈM MỤC TIÊU GIÁO DỤC BẮT BUỘC)
// -------------------------------------------------------------
export const OFFICIAL_GAMIFICATION_BADGES: GamificationBadge[] = [
  {
    id: 'BADGE_FIRST_STEP',
    title: 'Khởi đầu Vững chắc',
    description: 'Hoàn thành bài tập đầu tiên trên nền tảng EDUNOVA.',
    category: 'EFFORT',
    iconName: 'Sparkles',
    pedagogicalObjective:
      'Tạo động lực ban đầu, khích lệ học sinh tự tin tiếp cận nền tảng học tập số và hình thành cảm giác hoàn thành nhiệm vụ.',
    isEarned: false,
  },
  {
    id: 'BADGE_MISTAKE_CONQUEROR',
    title: 'Dũng cảm Sửa sai',
    description: 'Luyện tập lại và làm đúng ít nhất 1 câu hỏi từng làm sai.',
    category: 'PERSISTENCE',
    iconName: 'RotateCcw',
    pedagogicalObjective:
      'Bồi dưỡng tư duy phát triển (Growth Mindset): Giúp học sinh nhận thức sai lầm là cơ hội quý để học hỏi, không sợ sai và kiên trì khắc phục lỗ hổng kiến thức.',
    isEarned: false,
  },
  {
    id: 'BADGE_ACCURACY_STAR',
    title: 'Ngôi sao Chuẩn xác',
    description: 'Đạt điểm số tuyệt đối 100% trong một bài tập vận dụng.',
    category: 'MASTERY',
    iconName: 'Award',
    pedagogicalObjective:
      'Rèn luyện đức tính cẩn thận, thói quen đọc kỹ đề bài và kỹ năng tự soát lại kết quả tính toán trước khi nộp bài.',
    isEarned: false,
  },
  {
    id: 'BADGE_PERSISTENCE_STREAK',
    title: 'Chiến binh Chăm chỉ',
    description: 'Hoàn thành ít nhất 3 bài luyện tập khác nhau.',
    category: 'PERSISTENCE',
    iconName: 'Flame',
    pedagogicalObjective:
      'Hình thành nhịp điệu học tập đều đặn, rèn luyện tính kiên nhẫn và trách nhiệm đối với việc học hàng ngày.',
    isEarned: false,
  },
  {
    id: 'BADGE_STAGE_1_MASTER',
    title: 'Nhà Thám hiểm Số học',
    description: 'Chinh phục toàn bộ các bài học trong Chặng 1 (Ôn tập và bổ sung).',
    category: 'MILESTONE',
    iconName: 'Compass',
    pedagogicalObjective:
      'Nắm vững cấu tạo thập phân của số có 5 chữ số, so sánh các số và phân biệt số chẵn - số lẻ theo chuẩn SGK Toán 4.',
    isEarned: false,
  },
  {
    id: 'BADGE_CHALLENGE_SOLVER',
    title: 'Thử thách Toán học',
    description: 'Giải quyết thành công câu hỏi mức Vận dụng hoặc Bài toán có lời văn.',
    category: 'MASTERY',
    iconName: 'Zap',
    pedagogicalObjective:
      'Phát triển năng lực giải quyết vấn đề toán học và tư duy logic đa bước trong các tình huống thực tiễn sinh động.',
    isEarned: false,
  },
];

// -------------------------------------------------------------
// DANH MỤC CÁC CHẶNG HỌC TẬP (STAGE MILESTONES)
// -------------------------------------------------------------
export const OFFICIAL_STAGE_MILESTONES: StageMilestone[] = [
  {
    id: 'STAGE_1',
    stageNumber: 1,
    title: 'Chặng 1: Ôn tập & Các số đến 100 000',
    description: 'Làm quen với số có năm chữ số, cấu tạo hàng lớp và số chẵn số lẻ.',
    requiredLessonIds: ['lesson_01', 'lesson_02', 'lesson_03'],
    isUnlocked: true, // Mặc định mở khóa khi bắt đầu
    isCompleted: false,
    unlockConditionText: 'Mở khóa mặc định khi bắt đầu năm học Toán 4.',
    pedagogicalObjective:
      'Hệ thống hóa toàn bộ kiến thức số học lớp 3 và mở rộng vững chắc sang phạm vi 100 000.',
  },
  {
    id: 'STAGE_2',
    stageNumber: 2,
    title: 'Chặng 2: Biểu thức Chứa chữ & Hình học Cơ bản',
    description: 'Khám phá biểu thức toán học, góc nhọn, góc tù, góc bẹt và hai đường thẳng vuông góc.',
    requiredLessonIds: ['lesson_04', 'lesson_05', 'lesson_06', 'lesson_07'],
    isUnlocked: false,
    isCompleted: false,
    unlockConditionText: 'Hoàn thành ít nhất 1 bài tập thuộc Chặng 1 với độ chính xác từ 60% trở lên.',
    pedagogicalObjective:
      'Hình thành tư duy đại số sơ cấp và phát triển khả năng tưởng tượng không gian hình học trực quan.',
  },
  {
    id: 'STAGE_3',
    stageNumber: 3,
    title: 'Chặng 3: Bốn Phép tính với Số tự nhiên',
    description: 'Thành thạo phép cộng, trừ, nhân, chia với số có nhiều chữ số và tính chất phép toán.',
    requiredLessonIds: ['lesson_08', 'lesson_09', 'lesson_10', 'lesson_11'],
    isUnlocked: false,
    isCompleted: false,
    unlockConditionText: 'Hoàn thành các bài tập trọng tâm của Chặng 2.',
    pedagogicalObjective:
      'Rèn luyện kỹ thuật tính toán chính xác, linh hoạt vận dụng các tính chất giao hoán, kết hợp.',
  },
  {
    id: 'STAGE_4',
    stageNumber: 4,
    title: 'Chặng 4: Đo lường, Thống kê & Phân số',
    description: 'Đơn vị đo diện tích, biểu đồ cột, xác suất đơn giản và khái niệm phân số cốt lõi.',
    requiredLessonIds: ['lesson_12', 'lesson_13', 'lesson_14'],
    isUnlocked: false,
    isCompleted: false,
    unlockConditionText: 'Hoàn thành các bài tập trọng tâm của Chặng 3.',
    pedagogicalObjective:
      'Mở rộng tư duy toán học sang đo lường thực tế, thống kê dữ liệu và số học phân số.',
  },
];
