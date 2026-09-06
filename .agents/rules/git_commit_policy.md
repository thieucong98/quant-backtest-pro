---
trigger: manual
---

# Professional Git Flow & Branching Standards (MANDATORY)

## 1. Bắt Buộc Checkout Nhánh Mới Trước Khi Thực Thi
- **TUYỆT ĐỐI KHÔNG triển khai code tính năng, sửa đổi lớn hoặc fix bug trực tiếp trên nhánh `main`**.
- Trước khi bắt đầu viết code cho bất kỳ task/tính năng/bugfix nào, AI Agent bắt buộc phải:
  1. Kiểm tra trạng thái git: `git status` (đảm bảo working tree sạch).
  2. Tạo và checkout sang nhánh chuyên biệt theo quy chuẩn Git Flow:
     - `feature/<ten-tinh-nang>`: Tính năng mới hoặc bổ sung giao diện.
     - `fix/<ten-loi>`: Sửa lỗi logic, hiển thị hoặc bảo mật.
     - `refactor/<ten-module>`: Tái cấu trúc kiến trúc, tách store/component.
     - `perf/<ten-toi-uu>`: Tối ưu hiệu năng render, tính toán.
     - `test/<ten-test>`: Bổ sung bộ kiểm thử.
     - `docs/<ten-tai-lieu>`: Cập nhật tài liệu kỹ thuật.

## 2. Quy Chuẩn Commit Cục Bộ (Local Commits Only)
- Sau khi hoàn thành và vượt qua tất cả Quality Gates (`npx tsc --noEmit`, `npm run check:i18n`, `npm test`, `npm run build`), tạo commit cục bộ sạch sẽ theo chuẩn **Conventional Commits**:
  - `feat(...)`: Tính năng mới.
  - `fix(...)`: Sửa lỗi.
  - `refactor(...)`: Tái cấu trúc mã nguồn.
  - `docs(...)`: Tài liệu.
  - `test(...)`: Kiểm thử.

## 3. Quy Định Tuyệt Đối Về Git Push
- **TUYỆT ĐỐI KHÔNG TỰ Ý PUSH** code lên origin/remote repository (`git push`) trừ khi người dùng đưa ra câu lệnh hoặc yêu cầu rõ ràng (ví dụ: "push code", "đẩy code lên git").
- Mọi quy trình tự động mặc định dừng ở bước commit cục bộ.
