# Quant Backtest Pro — Hướng Dẫn Cấu Hình Đăng Nhập & OAuth 🔐

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để cấu hình các nhà cung cấp đăng nhập mạng xã hội (SSO) và cơ chế tự động nhận diện cấu hình trong **Quant Backtest Pro**.

---

## 1. Tổng Quan Kiến Trúc Đăng Nhập

Quant Backtest Pro hỗ trợ hệ thống xác thực linh hoạt, an toàn với tiêu chí **Sẵn sàng sử dụng mặc định (Zero-Config Default)**:

1. **Email & Mật khẩu tiêu chuẩn (Sẵn sàng ngay)**:
   - Đăng ký đầy đủ, mã hóa bảo mật mật khẩu với `bcrypt`, cấp phát JWT Bearer Token thời hạn 30 ngày an toàn.
2. **Tài khoản mẫu 1-Click Institutional Demo Trader (Sẵn sàng ngay)**:
   - Tài khoản tổ chức được tạo sẵn (`admin@quantbacktest.pro` / `QuantPro@2026`) giúp trải nghiệm backtest tức thì mà không cần thao tác thiết lập phức tạp.
3. **Cơ chế nhận diện SSO động (Google, GitHub, Apple)**:
   - Ứng dụng tự động truy vấn cấu hình từ máy chủ backend (`GET /api/auth/providers`).
   - **Tự động ẩn tùy chọn chưa cấu hình (Auto-Hide)**: Khi các biến môi trường Client ID / Secret chưa được điền trong `server/.env`, các nút đăng nhập mạng xã hội và đường phân cách *"Hoặc tiếp tục với"* sẽ **tự động được ẩn hoàn toàn** khỏi giao diện.
   - Khi quản trị viên điền thông tin xác thực và khởi động lại máy chủ, nút tương ứng sẽ tự động hiển thị trong `AuthModal`.

---

## 2. Hướng Dẫn Cấu Hình Google OAuth 2.0

### Bước 1: Tạo dự án trên Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới (ví dụ: `Quant Backtest Pro`).
3. Truy cập menu **APIs & Services** > **OAuth consent screen** (Màn hình đồng ý OAuth).
4. Chọn User Type là **External** (hoặc **Internal** nếu dùng Google Workspace nội bộ) và điền các thông tin ứng dụng cần thiết.

### Bước 2: Tạo thông tin xác thực OAuth 2.0 Client ID
1. Vào mục **APIs & Services** > **Credentials** (Thông tin xác thực).
2. Nhấn **Create Credentials** > **OAuth client ID**.
3. Chọn Application type: **Web application**.
4. Cấu hình các đường dẫn URI:
   - **Authorized JavaScript origins** (Nguồn gốc JavaScript được ủy quyền):
     - `http://localhost:5173` (Môi trường phát triển cục bộ)
     - `https://domain-cua-ban.com` (Môi trường production)
   - **Authorized redirect URIs** (URI chuyển hướng được ủy quyền):
     - `http://localhost:5173/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
5. Nhấn **Create**. Sao chép giá trị **Client ID** và **Client Secret**.

### Bước 3: Thêm vào file cấu hình môi trường
Trong file `server/.env`:
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 3. Hướng Dẫn Cấu Hình GitHub OAuth

### Bước 1: Tạo OAuth App trên GitHub
1. Đăng nhập vào tài khoản GitHub của bạn.
2. Vào **Settings** > **Developer settings** > **OAuth Apps**.
3. Nhấn **New OAuth App** (Đăng ký ứng dụng OAuth mới).
4. Điền các trường thông tin:
   - **Application name**: `Quant Backtest Pro`
   - **Homepage URL**: `http://localhost:5173` (hoặc domain của bạn)
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github` (hoặc `http://localhost:5173/auth/callback/github`)
5. Nhấn **Register application**.

### Bước 2: Tạo Client Secret
1. Tại trang cấu hình ứng dụng vừa tạo, sao chép giá trị **Client ID**.
2. Nhấn **Generate a new client secret** và sao chép mã khóa bí mật.

### Bước 3: Thêm vào file cấu hình môi trường
Trong file `server/.env`:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## 4. Hướng Dẫn Cấu Hình Apple Sign-In

### Bước 1: Đăng ký App ID & Services ID
1. Đăng nhập vào [Apple Developer Account](https://developer.apple.com/account/).
2. Vào **Certificates, Identifiers & Profiles** > **Identifiers**.
3. Tạo một **App ID** có bật tính năng **Sign in with Apple**.
4. Tạo một **Services ID** (ví dụ: `com.yourdomain.quantbacktest.service`).
5. Cấu hình Services ID:
   - Bật **Sign in with Apple**.
   - Cài đặt **Domains and Subdomains**: `yourdomain.com` (hoặc `localhost`).
   - Cài đặt **Return URLs**: `https://your-domain.com/api/auth/callback/apple`.

### Bước 2: Tạo Private Key
1. Vào mục **Keys** > **Create a key**.
2. Chọn **Sign in with Apple** và liên kết với App ID chính của bạn.
3. Tải về file khóa `.p8`, ghi lại mã **Key ID** và **Team ID** của bạn.

### Bước 3: Thêm vào file cấu hình môi trường
Trong file `server/.env`:
```env
APPLE_CLIENT_ID="com.yourdomain.quantbacktest.service"
APPLE_CLIENT_SECRET="your-apple-client-secret-or-jwt"
APPLE_TEAM_ID="your-apple-team-id"
```

---

## 5. Kiểm Tra và Vận Hành

1. Mở file `server/.env` và điền thông tin xác thực tương ứng.
2. Khởi động lại hệ thống:
   ```bash
   npm run start:all
   ```
3. Kiểm tra endpoint cấu hình nhà cung cấp:
   ```bash
   curl http://localhost:3001/api/auth/providers
   ```
   Kết quả mẫu:
   ```json
   {
     "providers": {
       "google": true,
       "github": true,
       "apple": false
     }
   }
   ```
4. Truy cập `http://localhost:5173` và mở bảng **Đăng nhập / Đăng ký**:
   - Chỉ các tùy chọn đã cấu hình thành công mới xuất hiện.
   - Nếu chưa cấu hình bất kỳ nhà cung cấp SSO nào, toàn bộ khu vực SSO và đường gạch nối sẽ được tự động ẩn đi, giữ cho giao diện luôn tinh gọn, tập trung và chuyên nghiệp.
