# KIẾN TRÚC TỔNG THỂ DỰ ÁN EDUNOVA
Dự án: Nền tảng Giáo dục Thông minh EDUNOVA
Sản phẩm khởi đầu: EDUNOVA – Vui học Toán 4

## 1. Cấu trúc thư mục

```text
/
├── .env.example              # Khung biến môi trường mẫu (không chứa bí mật)
├── index.html                # Điểm vào HTML chính, tối ưu SEO & siêu dữ liệu
├── metadata.json             # Khai báo định danh applet AI Studio
├── package.json              # Khai báo phụ thuộc & scripts
├── tsconfig.json             # Cấu hình TypeScript
├── vite.config.ts            # Cấu hình Vite & Tailwind CSS
├── docs/                     # Tài liệu kỹ thuật, kiểm toán môi trường, kiến trúc
│   ├── ARCHITECTURE.md
│   └── ENVIRONMENT_AUDIT.md
└── src/                      # Mã nguồn ứng dụng
    ├── main.tsx              # Điểm khởi tạo React
    ├── App.tsx               # Điểm điều phối ứng dụng & routing
    ├── index.css             # CSS toàn cục & định nghĩa theme Tailwind
    ├── types/                # Kiểu dữ liệu dùng chung (Types & Interfaces)
    │   └── index.ts
    ├── components/           # Các thành phần giao diện
    │   ├── ui/               # Hệ thống thành phần nền tảng (Design System)
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Table.tsx
    │   │   ├── Alert.tsx
    │   │   ├── Loading.tsx
    │   │   └── EmptyState.tsx
    │   ├── common/           # Thành phần chung cho ứng dụng
    │   │   ├── Logo.tsx
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── UnimplementedModal.tsx
    │   └── landing/          # Các khối trên trang giới thiệu
    │       ├── HeroSection.tsx
    │       ├── BrandValuesSection.tsx
    │       ├── FeaturesSection.tsx
    │       ├── Math4Section.tsx
    │       ├── WorkflowSection.tsx
    │       └── AIAssistantSection.tsx
    ├── layouts/              # Khung giao diện theo từng vai trò
    │   ├── MainLayout.tsx    # Layout công khai (Landing, Chính sách, Hướng dẫn)
    │   ├── StudentLayout.tsx # Khung học sinh
    │   ├── TeacherLayout.tsx # Khung giáo viên
    │   ├── AdminLayout.tsx   # Khung ban giám hiệu / quản trị viên
    │   └── ParentLayout.tsx  # Khung phụ huynh
    └── pages/                # Các trang màn hình
        ├── LandingPage.tsx
        ├── PrivacyPolicyPage.tsx
        ├── UserGuidePage.tsx
        ├── StudentDashboard.tsx
        ├── TeacherDashboard.tsx
        ├── AdminDashboard.tsx
        └── ParentDashboard.tsx
```

## 2. Hệ thống phân quyền (RBAC - Role Based Access Control)

- **PUBLIC**: Khách vãng lai, xem giới thiệu, chính sách, hướng dẫn, xem thử khung chương trình.
- **STUDENT (Học sinh)**: Truy cập học phần Toán 4, làm bài tập, xem gợi ý từ trợ giảng AI, xem lộ trình tiến bộ cá nhân.
- **TEACHER (Giáo viên)**: Quản lý học sinh, giao bài tập, theo dõi thống kê năng lực theo chuẩn GDPT, nhận gợi ý sư phạm.
- **ADMIN (Nhà trường/Quản trị)**: Quản lý khối lớp, giáo viên, phân bổ tài nguyên, giám sát an toàn hệ thống.
- **PARENT (Phụ huynh)**: Theo dõi tiến độ học tập của con, nhận khuyến nghị đồng hành không tạo áp lực.
