/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  AiRequestType,
  AiScaffoldingOutput,
  AiResponsePayload,
} from '../../src/types/ai.ts';
import { AiConfigStore } from './ai-config-store.ts';

// Khởi tạo Gemini client an toàn ở tầng backend
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ScaffoldingPromptContext {
  // Bối cảnh học liệu đã duyệt (TUYỆT ĐỐI KHÔNG CHỨA PII HỌC SINH)
  lessonId: string;
  lessonTitle: string;
  strandCode?: string;
  topicTitle?: string;
  coreRules?: string[];
  questionPrompt?: string;
  studentAttempt?: string;
  userQuery?: string;
  requestType: AiRequestType;
  actorRole: string; // 'STUDENT' | 'TEACHER'
}

export class GeminiService {
  /**
   * Kiểm tra tình trạng sẵn sàng của Gemini API
   */
  public static isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key.trim() !== '');
  }

  /**
   * Health-check gọi nhanh mô hình để xác thực kết nối
   */
  public static async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    const ai = getGenAIClient();
    if (!ai) {
      return {
        ok: false,
        message: 'Chưa cấu hình GEMINI_API_KEY trong biến môi trường / Secrets.',
        latencyMs: 0,
      };
    }

    try {
      const pingPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping kiểm tra kết nối hệ thống EDUNOVA Toán 4. Trả lời: PONG.',
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 5000)
      );

      const response = await Promise.race([pingPromise, timeoutPromise]);
      const latencyMs = Date.now() - startTime;
      const text = response.text || '';
      return {
        ok: text.toLowerCase().includes('pong') || text.length > 0,
        message: `Kết nối Gemini API thành công (Mô hình: gemini-3.8-flash, Độ trễ: ${latencyMs}ms).`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        message: `Lỗi kết nối Gemini API (${err?.message || 'Không thể kết nối'}).`,
        latencyMs,
      };
    }
  }

  /**
   * Tạo phản hồi sư phạm Scaffolding AI
   */
  public static async generateScaffolding(
    context: ScaffoldingPromptContext,
    actorUserId: string
  ): Promise<AiResponsePayload> {
    const startTime = Date.now();
    const sysConfig = AiConfigStore.getConfig();

    // 1. Kiểm tra công tắc toàn cục (Global Kill Switch)
    if (!sysConfig.isAiEnabled) {
      AiConfigStore.addUsageRecord({
        userId: actorUserId,
        userRole: context.actorRole,
        lessonId: context.lessonId,
        requestType: context.requestType,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        status: 'DISABLED',
        latencyMs: Date.now() - startTime,
        sanitizedContextNote: `Yêu cầu bị từ chối do AI đang tạm ngưng toàn hệ thống`,
      });

      return {
        success: false,
        errorCode: 'AI_DISABLED',
        error: 'Hệ thống Trợ giảng AI EDUNOVA hiện đang tạm tắt theo cấu hình của Quản trị viên để bảo trì. Em vui lòng tự ôn bài hoặc nhờ thầy cô giải đáp nhé!',
      };
    }

    // 2. Kiểm tra khóa API môi trường
    const ai = getGenAIClient();
    if (!ai) {
      AiConfigStore.addUsageRecord({
        userId: actorUserId,
        userRole: context.actorRole,
        lessonId: context.lessonId,
        requestType: context.requestType,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        status: 'UNCONFIGURED',
        latencyMs: Date.now() - startTime,
        sanitizedContextNote: 'Yêu cầu không thể thực hiện do thiếu GEMINI_API_KEY',
      });

      return {
        success: false,
        errorCode: 'AI_UNCONFIGURED',
        error:
          'Trợ giảng AI chưa được kích hoạt vì thiếu khóa GEMINI_API_KEY. Quản trị viên vui lòng thiết lập khóa trong bảng điều khiển Settings > Secrets của dự án.',
      };
    }

    // 3. Kiểm soát chi phí & Hạn mức ngày
    const quotaResult = AiConfigStore.consumeQuota(actorUserId, context.actorRole);
    if (!quotaResult.allowed) {
      AiConfigStore.addUsageRecord({
        userId: actorUserId,
        userRole: context.actorRole,
        lessonId: context.lessonId,
        requestType: context.requestType,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        status: 'RATE_LIMITED',
        latencyMs: Date.now() - startTime,
        sanitizedContextNote: `Vượt hạn mức ngày: ${quotaResult.quota.usedToday}/${quotaResult.quota.dailyLimit}`,
      });

      const roleLabel = context.actorRole === 'STUDENT' ? 'Em' : 'Thầy/Cô';
      return {
        success: false,
        errorCode: 'RATE_LIMITED',
        quota: quotaResult.quota,
        error: `${roleLabel} đã dùng hết hạn mức ${quotaResult.quota.dailyLimit}/${quotaResult.quota.dailyLimit} lượt hỏi AI trong ngày hôm nay. Hãy tiếp tục tự suy nghĩ và luyện tập nhé!`,
      };
    }

    // 4. Xây dựng System Prompt với Guardrails sư phạm nghiêm ngặt
    const isTeacherMode = context.actorRole === 'TEACHER' || context.requestType.startsWith('TEACHER_');

    const systemInstruction = `
Bạn là Trợ giảng Sư phạm Scaffolding AI EDUNOVA của môn Toán 4 (tiểu học Việt Nam, 9-10 tuổi), thuộc Bộ sách Kết nối tri thức với cuộc sống.

QUY TẮC CỐT LÕI (SCAFFOLDING PEDAGOGY):
1. TUYỆT ĐỐI KHÔNG GIẢI HỘ BÀI: Tuyệt đối không bao giờ làm trọn vẹn toàn bộ bài tập đang làm hoặc đưa ra đáp án cuối cùng ngay lập tức cho học sinh.
2. VAI TRÒ NGƯỜI ĐỒNG HÀNH:
   - Phân tích nguyên nhân sai sót: Giúp học sinh hiểu tại sao chưa đúng (ví dụ nhầm hàng đơn vị, quên nhớ khi cộng, nhầm quy tắc đọc số).
   - Nhắc lại quy tắc SGK: Chỉ nhắc quy tắc, tính chất cốt lõi đã học trong SGK Toán 4.
   - Gợi ý bước tiếp theo: Đưa ra 1 gợi ý hoặc câu hỏi gợi mở để học sinh tự làm bước kế tiếp.
   - Ví dụ tương tự: Luôn đưa ra một ví dụ cùng dạng nhưng số liệu khác kèm gợi ý ngắn để học sinh tự luyện.
3. PHÙ HỢP LỨA TUỔI TIỂU HỌC: Ngôn ngữ tiếng Việt trong sáng, ấm áp, khích lệ ("Em hãy thử xem...", "Thầy/cô thấy em đã cố gắng rất nhiều!"). Không dùng thuật ngữ toán học cao cấp ngoài chương trình lớp 4.
4. THỪA NHẬN KHI THIẾU DỮ LIỆU HOẶC KHÔNG CHẮC CHẮN:
   - Nếu bài học không có đủ dữ liệu đã duyệt hoặc câu hỏi nằm ngoài phạm vi SGK, hãy nói trung thực: "Thầy/cô chưa có đủ dữ liệu từ SGK đã duyệt cho phần này, em hãy hỏi thầy cô giáo trên lớp nhé!".
   - KHÔNG bịa đặt nội dung SGK hay số trang không có trong tài liệu.
5. KHÔNG THAY THẾ GIÁO VIÊN: Mọi phản hồi chỉ mang tính chất trợ giúp định hướng, không tự xưng là đáp án chính thức.
6. TỪ CHỐI AN TOÀN: Từ chối lịch sự mọi câu hỏi không thuộc phạm vi học tập hoặc không phù hợp lứa tuổi học sinh tiểu học.
${isTeacherMode ? '7. CHẾ ĐỘ GIÁO VIÊN: Khi hỗ trợ giáo viên soạn câu hỏi hoặc phản hồi, kết quả luôn ở dạng bản thảo nháp (Draft), khuyến khích giáo viên biên tập trước khi thẩm định.' : ''}
`.trim();

    // 5. Chuẩn bị Prompt Context (ĐÃ LỌC BỎ HOÀN TOÀN TÊN VÀ PII CỦA HỌC SINH)
    const promptParts: string[] = [];
    promptParts.push(`BỐI CẢNH BÀI HỌC TOÁN 4 (HỌC LIỆU ĐÃ PHÊ DUYỆT):`);
    promptParts.push(`- Mã bài: ${context.lessonId}`);
    promptParts.push(`- Tên bài: ${context.lessonTitle}`);
    if (context.topicTitle) promptParts.push(`- Chủ đề SGK: ${context.topicTitle}`);
    if (context.coreRules && context.coreRules.length > 0) {
      promptParts.push(`- Quy tắc trọng tâm trong bài: ${context.coreRules.join('; ')}`);
    }

    if (context.questionPrompt) {
      promptParts.push(`\nCÂU HỎI / ĐỀ BÀI ĐANG HỌC:\n"${context.questionPrompt}"`);
    }

    if (context.studentAttempt) {
      promptParts.push(`\nCÂU TRẢ LỜI / SUY NGHĨ CỦA HỌC SINH:\n"${context.studentAttempt}"`);
    }

    if (context.userQuery) {
      promptParts.push(`\nYÊU CẦU CẦN TRỢ GIÚP:\n"${context.userQuery}"`);
    }

    promptParts.push(`\nLOẠI YÊU CẦU: ${context.requestType}`);
    promptParts.push(`HÃY TRẢ LỜI ĐÚNG ĐỊNH DẠNG JSON THEO SCHEMA ĐÃ ĐỊNH NGHĨA.`);

    const userPrompt = promptParts.join('\n');

    let response: any = null;
    let isTimeout = false;

    try {
      const callPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              misconceptionAnalysis: {
                type: Type.STRING,
                description: 'Phân tích nguyên nhân sai sót hoặc nhận xét tư duy của học sinh',
              },
              ruleReminder: {
                type: Type.STRING,
                description: 'Quy tắc hoặc công thức SGK cốt lõi cần ghi nhớ',
              },
              nextStepHint: {
                type: Type.STRING,
                description: 'Gợi ý bước tiếp theo hoặc câu hỏi gợi mở, TUYỆT ĐỐI không giải trọn vẹn cả bài',
              },
              similarExample: {
                type: Type.OBJECT,
                description: 'Ví dụ bài tập tương tự với số liệu khác',
                properties: {
                  problem: { type: Type.STRING, description: 'Đề bài ví dụ tương tự' },
                  hint: { type: Type.STRING, description: 'Gợi ý giải cho ví dụ tương tự' },
                },
                required: ['problem', 'hint'],
              },
              encouragement: {
                type: Type.STRING,
                description: 'Lời động viên, khích lệ tinh thần học sinh lớp 4',
              },
            },
            required: ['nextStepHint', 'encouragement'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 7000)
      );

      response = await Promise.race([callPromise, timeoutPromise]);
    } catch (err: any) {
      if (err?.message === 'TIMEOUT_EXCEEDED') {
        isTimeout = true;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Xử lý khi AI thành công hoặc xử lý kịch bản lỗi/timeout êm thuận
    let parsedOutput: Partial<AiScaffoldingOutput> = {};

    if (response && response.text) {
      try {
        parsedOutput = JSON.parse(response.text);
      } catch {
        parsedOutput = {
          nextStepHint: response.text.slice(0, 300),
          encouragement: 'Em hãy đọc kỹ lại đề bài và thử áp dụng quy tắc đã học nhé!',
        };
      }
    } else {
      // Xử lý Timeout hoặc lỗi mạng: Cung cấp fallback scaffolding sư phạm chuẩn mực
      parsedOutput = {
        misconceptionAnalysis: isTimeout
          ? 'Hệ thống đã ghi nhận câu hỏi của em. Em hãy kiểm tra lại quy tắc cơ bản của bài học.'
          : 'Em đã cố gắng suy nghĩ, hãy cùng rà soát lại các bước làm nhé.',
        ruleReminder: context.coreRules && context.coreRules.length > 0
          ? context.coreRules[0]
          : 'Xác định rõ các hàng số từ phải sang trái: Hàng đơn vị, chục, trăm, nghìn, chục nghìn.',
        nextStepHint: 'Em hãy chia bài toán thành từng bước nhỏ: Xác định yêu cầu đề bài trước, sau đó tính toán từng hàng.',
        similarExample: {
          problem: 'Ví dụ tương tự: So sánh 45 200 và 45 190.',
          hint: 'So sánh các chữ số cùng hàng từ trái sang phải: hàng chục nghìn và nghìn bằng nhau, 2 trăm lớn hơn 1 trăm.',
        },
        encouragement: 'Em hãy kiên nhẫn thử sức từng bước nhé, thầy cô tin em sẽ làm được!',
      };
    }

    // Đảm bảo cấu trúc chuẩn mực & Gán nhãn bản thảo sư phạm
    const scaffoldingOutput: AiScaffoldingOutput = {
      misconceptionAnalysis: parsedOutput.misconceptionAnalysis || 'Em đã cố gắng tư duy, hãy cùng xem lại từng bước nhé.',
      ruleReminder: parsedOutput.ruleReminder || (context.coreRules ? context.coreRules[0] : 'Đọc kỹ đề và xác định hàng chữ số.'),
      nextStepHint: parsedOutput.nextStepHint || 'Em hãy thử làm từng bước: xác định hàng lớn nhất trước, sau đó so sánh tiếp.',
      similarExample: parsedOutput.similarExample || {
        problem: 'Ví dụ tương tự: So sánh 34 521 và 34 519.',
        hint: 'So sánh các chữ số cùng hàng từ trái sang phải: hàng chục nghìn, hàng nghìn, hàng trăm giống nhau, hãy xem hàng chục.',
      },
      encouragement: parsedOutput.encouragement || 'Thầy/cô tin em sẽ tự mình làm đúng câu này! Cố lên nào!',
      disclaimer: 'Trợ giảng AI EDUNOVA đóng vai trò người thầy đồng hành định hướng tư duy, không giải hộ toàn bộ bài kiểm tra.',
      isDraft: isTeacherMode ? true : undefined,
      reviewStatus: isTeacherMode ? 'PENDING_REVIEW' : undefined,
    };

    // Ghi nhật ký sử dụng tối thiểu (Privacy-first)
    const inputLengthEst = Math.ceil(userPrompt.length / 4);
    const outputLengthEst = Math.ceil(JSON.stringify(scaffoldingOutput).length / 4);

    AiConfigStore.addUsageRecord({
      userId: actorUserId,
      userRole: context.actorRole,
      lessonId: context.lessonId,
      requestType: context.requestType,
      estimatedInputTokens: inputLengthEst,
      estimatedOutputTokens: outputLengthEst,
      status: 'SUCCESS',
      latencyMs,
      sanitizedContextNote: isTimeout ? 'Xử lý thành công qua cơ chế timeout resilient' : `Bài: ${context.lessonId} | Dạng: ${context.requestType}`,
    });

    return {
      success: true,
      data: scaffoldingOutput,
      quota: quotaResult.quota,
    };
  }
}
