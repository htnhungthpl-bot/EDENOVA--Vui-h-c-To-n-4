# BÁO CÁO KIỂM TRA THỰC TẾ MÔI TRƯỜNG & HẠ TẦNG EDUNOVA
Thời điểm kiểm tra: 2026-10-10

## 1. Kết quả kiểm tra hiện trạng hệ thống

| Thành phần | Hiện trạng thực tế | Mức độ hỗ trợ / Ghi chú |
| :--- | :--- | :--- |
| **Node.js** | v22.23.2 | **Được hỗ trợ đầy đủ**. Chạy các tập lệnh hiện đại, ES Modules, TypeScript execution via tsx. |
| **npm** | 10.9.8 | **Được hỗ trợ đầy đủ**. Cài đặt và quản lý package ổn định. |
| **Firebase Auth & Firestore** | Chưa khởi tạo cấu hình dự án | **Hỗ trợ qua công cụ setup**. Cần chạy quy trình provisioning hoặc cấu hình firebase-applet-config khi bước vào giai đoạn CSDL/Xác thực. |
| **Biến môi trường & Secrets** | Có cơ chế tiêm tự động từ AI Studio | **Được hỗ trợ**. Biến `GEMINI_API_KEY` và `APP_URL` được nạp qua secrets của môi trường. Frontend dùng biến tiền tố `VITE_`. |
| **Triển khai Cloud Run** | Đang hoạt động trên Cloud Run container | **Được hỗ trợ đầy đủ**. Ứng dụng tự động đóng gói và phục vụ qua cổng 3000. |
| **Kết nối GitHub** | Chưa có kho lưu trữ git cục bộ (`.git`) | **KHÔNG được hỗ trợ tự động**. Môi trường sandbox AI Studio lưu trữ trực tiếp trên container; việc đồng bộ GitHub cần token hoặc thiết lập thủ công từ bên ngoài. |

## 2. Quyết định kiến trúc chốt

1. **Frontend Architecture**:
   - React 19 + TypeScript + Vite.
   - Tailwind CSS v4 với bảng màu thương hiệu: Navy (`#0F294A`), Cyan (`#0284C7`), Amber (`#F59E0B`), nền sáng trung tính (`#F8FAFC`).
   - Lucide React iconset.
   - Định hướng Single Page Application với client-side routing nhẹ, phân tách layout theo 4 vai trò (Học sinh, Giáo viên, Nhà trường/Quản trị, Phụ huynh).

2. **Backend & AI Architecture (Giai đoạn tiếp theo)**:
   - Node.js / Express proxy server cho các tác vụ nhạy cảm và gọi Gemini API từ backend (bảo vệ API Key, không lộ ra client).
   - Firebase Firestore cho lưu trữ dữ liệu lớp học, bài tập, tiến độ và phân quyền RBAC.
   - Bộ chấm quy tắc độc lập cho câu hỏi trắc nghiệm/điền số Toán 4, AI chỉ đóng vai trò phân tích lỗi sai và gợi ý tư duy Socratic.

3. **Nguyên tắc an toàn dữ liệu trẻ em**:
   - Thu thập tối thiểu (chỉ lưu mã định danh học sinh ẩn danh).
   - Tuyệt đối không đưa thông tin cá nhân (họ tên đầy đủ, ngày sinh, trường lớp chi tiết) vào prompt gửi tới mô hình AI.
