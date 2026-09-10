# Hướng Dẫn Cấu Hình Đăng Nhập & Tùy Chọn Xác Thực (Quant Backtest Pro) 🔐

Tài liệu này hướng dẫn chi tiết cách kích hoạt và thiết lập các tùy chọn đăng nhập mạng xã hội (Google, GitHub, Apple) cũng như cách quản lý tính năng xác thực trong **Quant Backtest Pro**.

---

## 1. Cơ Chế Ẩn / Hiện Thông Minh (Dynamic Auto-Discovery)

Nhằm đảm bảo trải nghiệm người dùng luôn chính xác và trung thực:
- **Trạng thái mặc định**: Khi bạn chưa cấu hình thông tin OAuth API Keys trong file `server/.env`, hệ thống sẽ **tự động ẩn các nút Google, GitHub, Apple** và dòng gạch ngang *"Hoặc tiếp tục với"*.
- **Tài khoản mặc định sẵn có**: Người dùng luôn có thể sử dụng:
  1. **Tài khoản Institutional mẫu 1-Click** (`admin@quantbacktest.pro` / `QuantPro@2026`).
  2. **Đăng ký & Đăng nhập bằng Email/Mật khẩu** thông thường (dữ liệu được mã hóa bcrypt và lưu trực tiếp vào database SQLite/PostgreSQL).
- **Tự động kích hoạt khi có cấu hình**: Ngay khi bạn thêm biến môi trường (ví dụ `GOOGLE_CLIENT_ID` hay `GITHUB_CLIENT_ID`), nút đăng nhập tương ứng sẽ tự động hiển thị trên giao diện!

---

## 2. Hướng Dẫn Cấu Hình Google OAuth 2.0

Để người dùng có thể bấm nút **"Đăng nhập bằng Google"**:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) và tạo một Project mới.
2. Đi tới **APIs & Services** > **OAuth consent screen**:
   - Chọn loại **External**.
   - Điền Tên ứng dụng, Email hỗ trợ, Logo (tùy chọn).
3. Đi tới **APIs & Services** > **Credentials**:
   - Bấm **Create Credentials** > chọn **OAuth client ID**.
   - Loại ứng dụng: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:5173` (hoặc tên miền website của bạn).
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
4. Copy **Client ID** và **Client Secret** được cấp.
5. Mở file `server/.env` và thêm:
   ```env
   GOOGLE_CLIENT_ID="123456789-xxxxxxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
   ```

---

## 3. Hướng Dẫn Cấu Hình GitHub OAuth

Để người dùng có thể bấm nút **"GitHub"**:

1. Đăng nhập GitHub > vào **Settings** (Cài đặt tài khoản) > cuộn xuống chọn **Developer settings** > **OAuth Apps**.
2. Bấm nút **New OAuth App**:
   - **Application name**: `Quant Backtest Pro`
   - **Homepage URL**: `http://localhost:5173` (hoặc domain của bạn)
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github` (hoặc `http://localhost:5173/auth/callback/github`)
3. Bấm **Register application**.
4. Copy **Client ID**.
5. Bấm **Generate a new client secret** để tạo và copy mã secret.
6. Mở file `server/.env` và thêm:
   ```env
   GITHUB_CLIENT_ID="Ov23liXXXXXXXXXXXXXX"
   GITHUB_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

---

## 4. Hướng Dẫn Cấu Hình Apple Sign-In

Để người dùng có thể bấm nút **"Apple"**:

1. Đăng nhập tài khoản [Apple Developer](https://developer.apple.com/account/).
2. Đi tới **Certificates, Identifiers & Profiles** > **Identifiers**.
3. Tạo **Services ID** (ví dụ: `com.yourdomain.quantbacktest.service`).
4. Kích hoạt tính năng **Sign in with Apple**, cấu hình domain và return URL.
5. Tạo khóa bí mật (Keys) và tải file private key `.p8`.
6. Mở file `server/.env` và thêm:
   ```env
   APPLE_CLIENT_ID="com.yourdomain.quantbacktest.service"
   APPLE_CLIENT_SECRET="your-apple-client-secret-or-jwt"
   APPLE_TEAM_ID="your-apple-team-id"
   ```

---

## 5. Áp Dụng Thay Đổi & Kiểm Tra

Sau khi đã lưu các biến môi trường vào file `server/.env`:

1. Khởi động lại server để nạp các biến môi trường mới:
   ```bash
   npm run start:all
   ```
2. Mở trình duyệt vào `http://localhost:5173`.
3. Bấm nút **Đăng nhập** ở góc trên thanh công cụ.
4. Bạn sẽ thấy các nút đăng nhập mạng xã hội mà bạn đã cấu hình xuất hiện ngay ngắn, sẵn sàng hoạt động!
