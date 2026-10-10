# HƯỚNG DẪN KHỞI TẠO TÀI KHOẢN SUPER_ADMIN ĐẦU TIÊN
Dự án: Nền tảng Giáo dục Thông minh EDUNOVA
Tiêu chuẩn: An toàn bảo mật tuyệt đối – Không mật khẩu mặc định – Tự vô hiệu hóa sau một lần chạy

---

## 1. Nguyên tắc An toàn (Nguyên tắc 8 & Giai đoạn 2)
1. **Không có tài khoản / mật khẩu mặc định công khai**: Không sử dụng `admin/admin` hoặc bất kỳ thông tin đăng nhập mặc định nào có thể bị tấn công.
2. **Khóa một lần (Self-disabling)**: Sau khi chạy thành công lần đầu, hệ thống tạo tập tin khóa `.super-admin-initialized` và bật cờ vô hiệu hóa vĩnh viễn. Mọi nỗ lực gọi lại script sẽ bị từ chối ngay lập tức.
3. **Độ phức tạp mật khẩu bắt buộc**: Mật khẩu phải có tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.

---

## 2. Các bước thực hiện

### Bước 1: Thiết lập biến môi trường bảo mật
Trước khi chạy, quản trị viên cấp cao thiết lập các biến môi trường một lần:

```bash
export INIT_SUPER_ADMIN_KEY="edunova-secure-init-2026"
export RUN_INIT_KEY="edunova-secure-init-2026"
export SUPER_ADMIN_EMAIL="admin@edunova.edu.vn"
export SUPER_ADMIN_PASSWORD="YourStrongPassword@2026"
```

### Bước 2: Thực thi script khởi tạo
Chạy lệnh khởi tạo qua runtime Node/tsx:

```bash
npx tsx server/scripts/init-super-admin.ts
```

### Bước 3: Kiểm tra kết quả
Nếu thành công, đầu ra sẽ có dạng:
```text
=== QUY TRÌNH KHỞI TẠO AN TOÀN SUPER_ADMIN ĐẦU TIÊN ===
✅ Thành công: Khởi tạo tài khoản SUPER_ADMIN đầu tiên thành công. Script đã tự vô hiệu hóa vĩnh viễn.
   Email: admin@edunova.edu.vn
   UID: super_admin_...
```

Và một bản ghi `INIT_SUPER_ADMIN_SUCCESS` được tự động ghi vào hệ thống **Audit Logs**.

---

## 3. Tạo các tài khoản trường học và giáo viên tiếp theo
Sau khi SUPER_ADMIN đã được tạo:
- Toàn bộ việc tạo tài khoản `SCHOOL_ADMIN`, `CONTENT_REVIEWER` được thực hiện trực tiếp từ giao diện điều hành của SUPER_ADMIN qua API đã được ký quyền `SUPER_ADMIN`.
- `SCHOOL_ADMIN` chỉ được tạo và quản lý `TEACHER` và `STUDENT` trong phạm vi trường học của mình.
- Học sinh tuyệt đối không thể tự nâng cấp hoặc đổi vai trò của mình.
