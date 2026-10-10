/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CurriculumLessonItem,
  QuestionItem,
  AnswerKeyItem,
  HomeworkAssignment,
  StudentSubmission,
  LessonReviewStatus,
} from '../../src/types/curriculum.ts';
import { OFFICIAL_MATH4_73_LESSONS } from '../../src/data/official-curriculum.ts';

export class CurriculumStore {
  public static lessons = new Map<string, CurriculumLessonItem>();
  public static questions = new Map<string, QuestionItem>();
  public static answerKeys = new Map<string, AnswerKeyItem>();
  public static assignments = new Map<string, HomeworkAssignment>();
  public static submissions = new Map<string, StudentSubmission>();

  // -------------------------------------------------------------
  // SEED 73 VỊ TRÍ BÀI HỌC THEO QUY CHUẨN (KHÔNG BỊA TÊN BÀI)
  // -------------------------------------------------------------
  public static seedCurriculum(): void {
    if (this.lessons.size > 0) return;

    // 1. BÀI 1 (Làm sâu - Trạng thái: Chờ duyệt - PENDING_REVIEW)
    const lesson1: CurriculumLessonItem = {
      id: 'lesson_01',
      positionNumber: 1,
      title: 'Bài 1: Ôn tập các số đến 100 000',
      strandCode: 'TOAN4-C1',
      topicNumber: 1,
      topicTitle: 'Chủ đề 1: Ôn tập và bổ sung',
      bookVolume: 1,
      page: 6,
      sourceBook: 'SGK Toán 4 Tập 1 - Kết nối tri thức với cuộc sống',
      status: 'PENDING_REVIEW',
      statusLabel: 'Chờ duyệt',
      isDetailed: true,
      notes: 'Đã đối chiếu chuẩn xác theo SGK Toán 4 Tập 1 (trang 6-8). Đang chờ CONTENT_REVIEWER thẩm định.',
      content: {
        objectives: [
          'Ôn tập đọc, viết, xác định cấu tạo thập phân của các số trong phạm vi 100 000.',
          'Rèn luyện kỹ năng so sánh các số và xác định số liền trước, số liền sau.',
          'Phát triển năng lực tư duy toán học và giải quyết vấn đề đơn giản.',
        ],
        warmUp: {
          activityTitle: 'Khởi động: Đố vui tìm chữ số bí mật',
          description:
            'Cô giáo viết lên bảng số 85 412. Em hãy cho biết chữ số 8 thuộc hàng nào và có giá trị là bao nhiêu?',
          questionPrompt: 'Giá trị của chữ số 8 trong số 85 412 là bao nhiêu?',
        },
        coreKnowledge: {
          summary: 'Cấu tạo thập phân của số có năm chữ số gồm: Hàng chục nghìn, hàng nghìn, hàng trăm, hàng chục, hàng đơn vị.',
          rules: [
            '1 chục nghìn = 10 nghìn = 10 000 đơn vị.',
            'Khi so sánh hai số: Số nào có nhiều chữ số hơn thì số đó lớn hơn.',
            'Nếu hai số có cùng số chữ số, so sánh từng cặp chữ số ở cùng một hàng kể từ trái sang phải.',
          ],
          diagramNote: 'Bảng các hàng: Chục nghìn | Nghìn | Trăm | Chục | Đơn vị',
        },
        examples: [
          {
            problem: 'Viết số sau thành tổng: 46 253',
            solutionSteps: [
              'Bước 1: Xác định giá trị từng chữ số: 4 chục nghìn (40 000), 6 nghìn (6 000), 2 trăm (200), 5 chục (50), 3 đơn vị (3).',
              'Bước 2: Viết tổng các giá trị: 46 253 = 40 000 + 6 000 + 200 + 50 + 3.',
            ],
            answer: '40 000 + 6 000 + 200 + 50 + 3',
          },
        ],
        basicPractice: [
          'Đọc và viết các số: 34 500; 70 821; 99 999.',
          'So sánh số 58 410 và 58 409.',
        ],
        advancedPractice: [
          'Tìm số tròn chục nghìn lớn nhất có 5 chữ số khác nhau.',
          'Viết số bé nhất có năm chữ số mà tổng các chữ số bằng 10.',
        ],
        application: {
          realLifeScenario: 'Bác nông dân thu hoạch được 25 350 kg thóc trong vụ mùa.',
          task: 'Em hãy làm tròn số thóc này đến hàng nghìn để báo cáo tổng kết.',
        },
        resultsSummary: 'Học sinh nắm vững cách đọc, viết, cấu tạo và so sánh số đến 100 000.',
        nextSuggestions: 'Chuẩn bị Bài 2: Ôn tập các phép tính trong phạm vi 100 000 (SGK trang 9).',
        aiTutorPlaceholder: {
          status: 'NOT_IMPLEMENTED',
          label: 'Trợ giảng AI Socratic',
          note: 'Chưa triển khai (Khu vực giữ chỗ giao diện - Sẽ kích hoạt kết nối Gemini API ở Giai đoạn 5).',
        },
      },
    };
    this.lessons.set(lesson1.id, lesson1);

    // 2. BÀI 2 (Làm sâu - Trạng thái: Chờ duyệt - PENDING_REVIEW)
    const lesson2: CurriculumLessonItem = {
      id: 'lesson_02',
      positionNumber: 2,
      title: 'Bài 2: Ôn tập các phép tính trong phạm vi 100 000',
      strandCode: 'TOAN4-C1',
      topicNumber: 1,
      topicTitle: 'Chủ đề 1: Ôn tập và bổ sung',
      bookVolume: 1,
      page: 9,
      sourceBook: 'SGK Toán 4 Tập 1 - Kết nối tri thức với cuộc sống',
      status: 'PENDING_REVIEW',
      statusLabel: 'Chờ duyệt',
      isDetailed: true,
      notes: 'Đã đối chiếu chuẩn xác theo SGK Toán 4 Tập 1 (trang 9-11). Đang chờ CONTENT_REVIEWER thẩm định.',
      content: {
        objectives: [
          'Củng cố kỹ năng thực hiện phép cộng, phép trừ không nhớ và có nhớ trong phạm vi 100 000.',
          'Rèn luyện kỹ năng nhân, chia số có năm chữ số với số có một chữ số.',
          'Vận dụng tính toán vào giải toán có lời văn và tính giá trị biểu thức.',
        ],
        warmUp: {
          activityTitle: 'Khởi động: Ong chăm tìm mật',
          description: 'Tính nhẩm nhanh: 40 000 + 30 000 = ? và 90 000 - 50 000 = ?',
        },
        coreKnowledge: {
          summary: 'Thực hiện phép tính đặt tính rồi tính theo thứ tự từ phải sang trái.',
          rules: [
            'Đặt tính: Viết các chữ số cùng hàng thẳng cột với nhau.',
            'Cộng/Trừ từ phải sang trái (bắt đầu từ hàng đơn vị).',
            'Khi nhân/chia: Nhân từ phải sang trái; chia từ trái sang phải.',
          ],
        },
        examples: [
          {
            problem: 'Đặt tính rồi tính: 35 240 + 24 185',
            solutionSteps: [
              '0 + 5 = 5',
              '4 + 8 = 12, viết 2 nhớ 1',
              '2 + 1 + 1 = 4, viết 4',
              '5 + 4 = 9, viết 9',
              '3 + 2 = 5, viết 5',
            ],
            answer: '59 425',
          },
        ],
        basicPractice: ['32 415 + 16 280', '74 850 - 23 410', '12 304 x 3', '48 240 : 4'],
        advancedPractice: ['Tìm x: x + 15 200 = 48 600', 'Tính nhanh: (25 000 + 15 000) x 2'],
        application: {
          realLifeScenario: 'Một trường tiểu học mua 12 500 quyển vở và được tặng thêm 3 200 quyển.',
          task: 'Hỏi trường có tất cả bao nhiêu quyển vở?',
        },
        resultsSummary: 'Học sinh thực hiện thành thạo 4 phép tính cơ bản trong phạm vi 100 000.',
        nextSuggestions: 'Chuẩn bị Bài 3: Số chẵn, số lẻ (SGK trang 12).',
        aiTutorPlaceholder: {
          status: 'NOT_IMPLEMENTED',
          label: 'Trợ giảng AI Socratic',
          note: 'Chưa triển khai (Khu vực giữ chỗ giao diện - Sẽ kích hoạt kết nối Gemini API ở Giai đoạn 5).',
        },
      },
    };
    this.lessons.set(lesson2.id, lesson2);

    // 3. BÀI 3 (Làm sâu - Trạng thái: Chờ duyệt - PENDING_REVIEW)
    const lesson3: CurriculumLessonItem = {
      id: 'lesson_03',
      positionNumber: 3,
      title: 'Bài 3: Số chẵn, số lẻ',
      strandCode: 'TOAN4-C1',
      topicNumber: 1,
      topicTitle: 'Chủ đề 1: Ôn tập và bổ sung',
      bookVolume: 1,
      page: 12,
      sourceBook: 'SGK Toán 4 Tập 1 - Kết nối tri thức với cuộc sống',
      status: 'PENDING_REVIEW',
      statusLabel: 'Chờ duyệt',
      isDetailed: true,
      notes: 'Đã đối chiếu chuẩn xác theo SGK Toán 4 Tập 1 (trang 12-13). Đang chờ CONTENT_REVIEWER thẩm định.',
      content: {
        objectives: [
          'Nhận biết số chia hết cho 2 là số chẵn; số không chia hết cho 2 là số lẻ.',
          'Nắm vững dấu hiệu: các số có chữ số tận cùng 0, 2, 4, 6, 8 là số chẵn; chữ số tận cùng 1, 3, 5, 7, 9 là số lẻ.',
          'Nhận biết hai số chẵn hoặc hai số lẻ liên tiếp hơn kém nhau 2 đơn vị.',
          'Vận dụng vào thực tế: đánh số nhà trên phố, nhận biết chẵn lẻ trên tia số, lập số.',
        ],
        warmUp: {
          activityTitle: 'Khởi động: Khám phá số nhà trên phố cùng Rô-bốt',
          description:
            'Tớ thấy một bên phố ghi các số nhà 10, 12, 14, 16, 18,... Bên kia thì ghi các số nhà 11, 13, 15, 17, 19,... Để dễ tìm số nhà, người ta dùng các số chẵn để đánh số nhà ở một bên của dãy phố, bên còn lại dùng các số lẻ.',
          questionPrompt: 'Số nhà liền sau số nhà 18 ở bên dãy số chẵn là số nào?',
        },
        coreKnowledge: {
          summary: 'Khái niệm và dấu hiệu nhận biết số chẵn, số lẻ theo chuẩn SGK Toán 4.',
          rules: [
            'Số chia hết cho 2 là số chẵn.',
            'Số không chia hết cho 2 là số lẻ.',
            'Các số có chữ số tận cùng 0, 2, 4, 6, 8 là các số chẵn (Ví dụ: 40, 72, 214, 96, 2 318,...).',
            'Các số có chữ số tận cùng 1, 3, 5, 7, 9 là các số lẻ (Ví dụ: 31, 73, 615, 107, 1 909,...).',
            'Hai số chẵn liên tiếp hơn kém nhau 2 đơn vị. Hai số lẻ liên tiếp hơn kém nhau 2 đơn vị.',
          ],
          diagramNote: 'Dãy số chẵn: 0, 2, 4, 6, 8, 10, 12... | Dãy số lẻ: 1, 3, 5, 7, 9, 11, 13...',
        },
        examples: [
          {
            problem: 'Trong các số: 315, 108, 71, 194, 656, 649, 72, số nào là số chẵn, số nào là số lẻ?',
            solutionSteps: [
              'Bước 1: Quan sát chữ số tận cùng của từng số.',
              'Bước 2: Các số có chữ số tận cùng là 8, 4, 6, 2 gồm: 108, 194, 656, 72 là các số chẵn.',
              'Bước 3: Các số có chữ số tận cùng là 5, 1, 9 gồm: 315, 71, 649 là các số lẻ.',
            ],
            answer: 'Số chẵn: 108, 194, 656, 72. Số lẻ: 315, 71, 649.',
          },
        ],
        basicPractice: [
          'Trong các số: 12, 315, 108, 71, 194, 656, 649, 72, 113, 107, số nào là số chẵn, số nào là số lẻ?',
          'Nêu các số chẵn, số lẻ trên tia số từ 0 đến 12.',
          'Từ 10 đến 31 có bao nhiêu số chẵn, bao nhiêu số lẻ?',
        ],
        advancedPractice: [
          'Nêu các số nhà còn thiếu: Dãy số chẵn: 116, 118, ?, ?, ?, 126. Dãy số lẻ: 117, 119, ?, ?, ?, 127.',
          'Từ hai trong ba thẻ số 7, 4, 5, hãy lập tất cả các số chẵn và các số lẻ có hai chữ số.',
        ],
        application: {
          realLifeScenario: 'Biết 116 và 118 là hai số chẵn liên tiếp hơn kém nhau 2 đơn vị; 117 và 119 là hai số lẻ liên tiếp hơn kém nhau 2 đơn vị.',
          task: 'Nêu tiếp các số chẵn để được ba số chẵn liên tiếp: 78, ?, ?; Nêu tiếp các số lẻ để được ba số lẻ liên tiếp: 67, ?, ?.',
        },
        resultsSummary: 'Học sinh phân biệt chính xác số chẵn, số lẻ dựa vào chữ số hàng đơn vị và áp dụng vào bài toán dãy số.',
        nextSuggestions: 'Chuẩn bị Bài 4: Biểu thức chứa chữ (SGK Toán 4 Tập 1, trang 14).',
        aiTutorPlaceholder: {
          status: 'NOT_IMPLEMENTED',
          label: 'Trợ giảng AI Socratic',
          note: 'Chưa triển khai (Khu vực giữ chỗ giao diện - Sẽ kích hoạt kết nối Gemini API ở Giai đoạn 5).',
        },
      },
    };
    this.lessons.set(lesson3.id, lesson3);

    // 4. CÁC BÀI TỪ VỊ TRÍ 4 ĐẾN 73: ĐÃ ĐỐI CHIẾU CHUẨN XÁC 100% THEO SGK
    for (let pos = 4; pos <= 73; pos++) {
      const official = OFFICIAL_MATH4_73_LESSONS[pos - 1];
      const padPos = pos < 10 ? `0${pos}` : `${pos}`;
      const lessonItem: CurriculumLessonItem = {
        id: `lesson_${padPos}`,
        positionNumber: pos,
        title: official.title,
        strandCode: official.strandCode,
        topicNumber: official.topicNumber,
        topicTitle: official.topicTitle,
        bookVolume: official.bookVolume,
        page: official.page,
        sourceBook: `SGK Toán 4 Tập ${official.bookVolume} - Kết nối tri thức với cuộc sống`,
        status: 'DRAFT',
        statusLabel: 'Đã đối chiếu SGK',
        isDetailed: false,
        notes: `Đã đối chiếu chuẩn xác theo SGK Toán 4 Tập ${official.bookVolume} (trang ${official.page}) - ${official.topicTitle} do người dùng cung cấp.`,
      };
      this.lessons.set(lessonItem.id, lessonItem);
    }

    // -------------------------------------------------------------
    // SEED NGÂN HÀNG CÂU HỎI 8 DẠNG BÀI TOÁN LỚP 4 (KÈM ĐÁP ÁN TÁCH RỜI)
    // -------------------------------------------------------------

    // Dạng 1: MULTIPLE_CHOICE (Trắc nghiệm)
    this.addQuestionWithKey({
      question: {
        id: 'q_mc_01',
        lessonId: 'lesson_01',
        lessonPosition: 1,
        questionType: 'MULTIPLE_CHOICE',
        prompt: 'Trong số 74 528, chữ số 4 có giá trị là bao nhiêu?',
        options: ['A. 40', 'B. 400', 'C. 4 000', 'D. 40 000'],
        points: 1,
        difficulty: 'EASY',
        knowledgeSource: 'Bài 1: Ôn tập các số đến 100 000 - Chuẩn GDPT 2018',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_mc_01',
        correctAnswer: 'C',
        explanation: 'Chữ số 4 đứng ở hàng nghìn nên có giá trị là 4 000.',
        gradingLogic: 'Exact string match with option label "C"',
      },
    });

    // Dạng 2: FILL_IN_BLANK (Điền số)
    this.addQuestionWithKey({
      question: {
        id: 'q_fib_01',
        lessonId: 'lesson_01',
        lessonPosition: 1,
        questionType: 'FILL_IN_BLANK',
        prompt: 'Điền số thích hợp vào chỗ trống: Số liền sau của số 89 999 là _____',
        points: 1,
        difficulty: 'EASY',
        knowledgeSource: 'Bài 1: Số liền trước và số liền sau',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_fib_01',
        correctAnswer: 90000,
        explanation: 'Số liền sau của một số bằng số đó cộng thêm 1: 89 999 + 1 = 90 000.',
        gradingLogic: 'Numeric comparison (90000 or "90000" or "90 000")',
      },
    });

    // Dạng 3: TRUE_FALSE (Đúng / Sai)
    this.addQuestionWithKey({
      question: {
        id: 'q_tf_01',
        lessonId: 'lesson_01',
        lessonPosition: 1,
        questionType: 'TRUE_FALSE',
        prompt: 'Khẳng định sau Đúng hay Sai: "Số 99 999 là số lớn nhất có năm chữ số."',
        points: 1,
        difficulty: 'EASY',
        knowledgeSource: 'Bài 1: Cấu tạo số tự nhiên',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_tf_01',
        correctAnswer: true,
        explanation: 'Đúng. Vì số liền sau của 99 999 là 100 000 (số có sáu chữ số nhỏ nhất).',
        gradingLogic: 'Boolean true or string "Đúng" / "True"',
      },
    });

    // Dạng 4: MATCHING (Nối cột A với cột B)
    this.addQuestionWithKey({
      question: {
        id: 'q_mat_01',
        lessonId: 'lesson_01',
        lessonPosition: 1,
        questionType: 'MATCHING',
        prompt: 'Nối mỗi số ở cột A với cách đọc tương ứng ở cột B:',
        matchingLeft: [
          { id: 'L1', text: '50 005' },
          { id: 'L2', text: '55 000' },
          { id: 'L3', text: '50 500' },
        ],
        matchingRight: [
          { id: 'R1', text: 'Năm mươi nghìn năm trăm' },
          { id: 'R2', text: 'Năm mươi lăm nghìn' },
          { id: 'R3', text: 'Năm mươi nghìn không trăm linh năm' },
        ],
        points: 2,
        difficulty: 'MEDIUM',
        knowledgeSource: 'Bài 1: Đọc viết số',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_mat_01',
        correctAnswer: { L1: 'R3', L2: 'R2', L3: 'R1' },
        explanation: '50 005 nối với R3; 55 000 nối với R2; 50 500 nối với R1.',
        gradingLogic: 'Key-value map comparison (all pairs must match)',
      },
    });

    // Dạng 5: ORDERING (Sắp xếp theo thứ tự)
    this.addQuestionWithKey({
      question: {
        id: 'q_ord_01',
        lessonId: 'lesson_01',
        lessonPosition: 1,
        questionType: 'ORDERING',
        prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 45 210, 45 099, 45 300, 45 150',
        orderingItems: [
          { id: 'O1', text: '45 210' },
          { id: 'O2', text: '45 099' },
          { id: 'O3', text: '45 300' },
          { id: 'O4', text: '45 150' },
        ],
        points: 2,
        difficulty: 'MEDIUM',
        knowledgeSource: 'Bài 1: So sánh và xếp thứ tự các số',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_ord_01',
        correctAnswer: ['O2', 'O4', 'O1', 'O3'], // 45 099 < 45 150 < 45 210 < 45 300
        explanation: 'Thứ tự từ bé đến lớn: 45 099 < 45 150 < 45 210 < 45 300.',
        gradingLogic: 'Ordered array sequence comparison',
      },
    });

    // Dạng 6: CALCULATION (Phép tính trực tiếp)
    this.addQuestionWithKey({
      question: {
        id: 'q_cal_01',
        lessonId: 'lesson_02',
        lessonPosition: 2,
        questionType: 'CALCULATION',
        prompt: 'Thực hiện phép tính: 24 150 + 13 820 = ?',
        points: 1,
        difficulty: 'EASY',
        knowledgeSource: 'Bài 2: Phép cộng trong phạm vi 100 000',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_cal_01',
        correctAnswer: 37970,
        explanation: 'Đặt tính từ phải sang trái: 24 150 + 13 820 = 37 970.',
        gradingLogic: 'Numeric equality: 37970',
      },
    });

    // Dạng 7: WORD_PROBLEM (Bài toán có lời văn)
    this.addQuestionWithKey({
      question: {
        id: 'q_wp_01',
        lessonId: 'lesson_02',
        lessonPosition: 2,
        questionType: 'WORD_PROBLEM',
        prompt: 'Một cửa hàng ngày thứ nhất bán được 12 500 m vải. Ngày thứ hai bán được gấp đôi ngày thứ nhất. Hỏi cả hai ngày cửa hàng bán được bao nhiêu mét vải? (Chỉ điền số kết quả)',
        points: 2,
        difficulty: 'HARD',
        knowledgeSource: 'Bài 2: Giải toán có lời văn hai bước tính',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_wp_01',
        correctAnswer: 37500,
        explanation: 'Ngày thứ hai bán: 12 500 x 2 = 25 000 m. Cả hai ngày: 12 500 + 25 000 = 37 500 m.',
        gradingLogic: 'Numeric equality: 37500',
      },
    });

    // Dạng 8: APPLICATION (Vận dụng số chẵn, số lẻ)
    this.addQuestionWithKey({
      question: {
        id: 'q_app_01',
        lessonId: 'lesson_03',
        lessonPosition: 3,
        questionType: 'APPLICATION',
        prompt: 'Từ ba thẻ số 7, 4, 5, hãy lập số chẵn lớn nhất có hai chữ số khác nhau. (Điền số kết quả)',
        points: 1,
        difficulty: 'MEDIUM',
        knowledgeSource: 'Bài 3: Số chẵn, số lẻ - SGK Toán 4 Tập 1 (Trang 13)',
        reviewStatus: 'PENDING_REVIEW',
      },
      answerKey: {
        questionId: 'q_app_01',
        correctAnswer: 74,
        explanation:
          'Số chẵn phải có chữ số tận cùng là 4. Hai số chẵn có hai chữ số khác nhau lập được từ ba thẻ 7, 4, 5 là 74 và 54. Vì 74 > 54 nên số chẵn lớn nhất là 74.',
        gradingLogic: 'Numeric equality: 74',
      },
    });

    console.log(`[CurriculumStore] Đã khởi tạo 73 bài học chuẩn xác theo SGK Toán 4 KNTT (3 bài làm sâu chờ duyệt, 70 bài đã đối chiếu danh mục) và 8 dạng câu hỏi.`);
  }

  private static addQuestionWithKey(item: { question: QuestionItem; answerKey: AnswerKeyItem }): void {
    this.questions.set(item.question.id, item.question);
    this.answerKeys.set(item.question.id, item.answerKey);
  }

  public static getLessons(filterStatus?: LessonReviewStatus): CurriculumLessonItem[] {
    let list = Array.from(this.lessons.values());
    if (filterStatus) {
      list = list.filter((l) => l.status === filterStatus);
    }
    return list.sort((a, b) => a.positionNumber - b.positionNumber);
  }

  public static getLessonById(id: string): CurriculumLessonItem | null {
    return this.lessons.get(id) || null;
  }

  public static approveLesson(
    lessonId: string,
    reviewerEmail: string
  ): CurriculumLessonItem {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) {
      throw new Error(`Không tìm thấy bài học [${lessonId}].`);
    }

    lesson.status = 'APPROVED';
    lesson.statusLabel = 'Đã duyệt';
    lesson.reviewedBy = reviewerEmail;
    lesson.reviewedAt = new Date().toISOString();

    // Đồng thời cập nhật trạng thái các câu hỏi thuộc bài học này thành APPROVED
    for (const q of this.questions.values()) {
      if (q.lessonId === lessonId) {
        q.reviewStatus = 'APPROVED';
      }
    }

    return lesson;
  }

  public static rejectLesson(
    lessonId: string,
    reviewerEmail: string,
    reason: string
  ): CurriculumLessonItem {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) {
      throw new Error(`Không tìm thấy bài học [${lessonId}].`);
    }

    lesson.status = 'DRAFT';
    lesson.statusLabel = 'Yêu cầu chỉnh sửa';
    lesson.reviewedBy = reviewerEmail;
    lesson.notes = `Lý do từ chối: ${reason}`;
    lesson.reviewedAt = new Date().toISOString();
    return lesson;
  }

  public static importLessonCatalog(
    items: Array<{
      positionNumber: number;
      title: string;
      strandCode?: string;
      notes?: string;
      status?: LessonReviewStatus;
    }>
  ): { updatedCount: number; totalCount: number } {
    let updatedCount = 0;
    for (const item of items) {
      if (!item.positionNumber || item.positionNumber < 1 || item.positionNumber > 73) continue;
      const padPos = item.positionNumber < 10 ? `0${item.positionNumber}` : `${item.positionNumber}`;
      const id = `lesson_${padPos}`;
      const existing = this.lessons.get(id);

      const status = item.status || (item.title.includes('[Chưa đối chiếu') ? 'UNVERIFIED' : 'PENDING_REVIEW');
      const statusLabel =
        status === 'APPROVED'
          ? 'Đã duyệt'
          : status === 'PENDING_REVIEW'
          ? 'Chờ duyệt'
          : status === 'DRAFT'
          ? 'Nháp'
          : 'Chưa đối chiếu';

      if (existing) {
        existing.title = item.title;
        if (item.strandCode) existing.strandCode = item.strandCode;
        if (item.notes) existing.notes = item.notes;
        existing.status = status;
        existing.statusLabel = statusLabel;
        updatedCount++;
      } else {
        const newLesson: CurriculumLessonItem = {
          id,
          positionNumber: item.positionNumber,
          title: item.title,
          strandCode: item.strandCode || 'TOAN4-C1',
          status,
          statusLabel,
          isDetailed: false,
          notes: item.notes || 'Cập nhật từ phân phối chương trình chính thức',
        };
        this.lessons.set(id, newLesson);
        updatedCount++;
      }
    }
    return { updatedCount, totalCount: this.lessons.size };
  }

  public static getQuestionsForLesson(
    lessonId: string,
    withAnswerKeys: boolean = false
  ): Array<QuestionItem & { answerKey?: AnswerKeyItem }> {
    const questions = Array.from(this.questions.values()).filter((q) => q.lessonId === lessonId);

    return questions.map((q) => {
      if (withAnswerKeys) {
        return { ...q, answerKey: this.answerKeys.get(q.id) };
      }
      return { ...q };
    });
  }

  public static getAnswerKey(questionId: string): AnswerKeyItem | null {
    return this.answerKeys.get(questionId) || null;
  }

  // -------------------------------------------------------------
  // ASSIGNMENTS MANAGEMENT
  // -------------------------------------------------------------
  public static createAssignment(data: {
    schoolId: string;
    classId: string;
    teacherId: string;
    lessonId: string;
    title: string;
    instructions: string;
    deadline: string;
  }): HomeworkAssignment {
    const lesson = this.getLessonById(data.lessonId);
    if (!lesson) {
      throw new Error(`Bài học [${data.lessonId}] không tồn tại.`);
    }

    // RÀNG BUỘC SƯ PHẠM: CHỈ NỘI DUNG ĐÃ DUYỆT MỚI ĐƯỢC GIAO CHO HỌC SINH!
    if (lesson.status !== 'APPROVED') {
      throw new Error(
        `Nội dung bài học [${lesson.title}] đang ở trạng thái [${lesson.statusLabel}]. Theo quy chuẩn dự án: Chỉ những bài học đã được CONTENT_REVIEWER phê duyệt (APPROVED) mới được phép giao cho học sinh.`
      );
    }

    // Lấy các câu hỏi đã duyệt của bài
    const approvedQuestions = Array.from(this.questions.values())
      .filter((q) => q.lessonId === data.lessonId && q.reviewStatus === 'APPROVED')
      .map((q) => q.id);

    if (approvedQuestions.length === 0) {
      throw new Error(`Bài học chưa có câu hỏi nào ở trạng thái Đã duyệt (APPROVED).`);
    }

    const assignment: HomeworkAssignment = {
      id: `asg_${Date.now()}`,
      schoolId: data.schoolId,
      classId: data.classId,
      teacherId: data.teacherId,
      lessonId: data.lessonId,
      title: data.title.trim(),
      instructions: data.instructions.trim(),
      questionIds: approvedQuestions,
      deadline: data.deadline,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };

    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  public static getAssignmentsByClass(classId: string): HomeworkAssignment[] {
    return Array.from(this.assignments.values())
      .filter((a) => a.classId === classId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public static getAssignmentById(id: string): HomeworkAssignment | null {
    return this.assignments.get(id) || null;
  }
}

CurriculumStore.seedCurriculum();
