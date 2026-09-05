---
trigger: always
---

# Mandatory Internationalization (i18n) & Code Quality Standards

> **QUY TẮC BẮT BUỘC DÀNH CHO TẤT CẢ AI AGENT & DEVELOPER TRONG DỰ ÁN NÀY**
> Mọi thay đổi mã nguồn, tính năng mới hoặc sửa đổi UI đều phải tuân thủ 100% các tiêu chuẩn dưới đây. Không có ngoại lệ.

---

## 1. Zero Hardcoded User-Facing Strings (Tuyệt Đối Không Viết Chữ Cố Định Vào Component)
- **CẤM**: Viết bất kỳ chuỗi văn bản tiếng Việt hoặc tiếng Anh nào trực tiếp trong JSX/TSX (tiêu đề, nhãn, nút bấm, placeholder, thông báo toast, modal, tooltip, option select, badge, text mô tả).
- **BẮT BUỘC**: Mọi chuỗi ký tự hiển thị cho người dùng **bắt buộc** phải lấy từ dictionary dịch `t.keyName` thông qua `const t = translations[language];` (hoặc `getTranslation(language)`).
- **CẤM**: Viết fallback chuỗi cố định theo kiểu `t.something || 'Chuỗi Tiếng Việt'`.
- **CẤM**: Viết logic điều kiện chứa text trực tiếp:
  - ❌ `showNews ? 'Lịch: Auto' : 'Lịch: TẮT'`
  - ❌ `active ? 'BẬT' : 'TẮT'`
  - ❌ `status === 'done' ? 'Đã qua' : 'Sắp tới'`
  - ✅ `showNews ? t.calendarModeAutoShort : t.calendarModeOffShort`
  - ✅ `active ? t.on : t.off`
  - ✅ `status === 'done' ? t.calendarStatusPassed : t.calendarStatusUpcoming`

---

## 2. Full Locale Parity Across 4 Supported Languages (100% Đồng Bộ 4 Ngôn Ngữ)
Hệ thống hiện tại hỗ trợ 4 ngôn ngữ chính thức:
1. `vi` - Tiếng Việt (`src/i18n/locales/vi.ts`)
2. `en` - English (`src/i18n/locales/en.ts`)
3. `ja` - 日本語 (`src/i18n/locales/ja.ts`)
4. `zh` - 中文 (`src/i18n/locales/zh.ts`)

- **BẮT BUỘC**: Bất kỳ khi nào thêm hoặc sửa một key trong `src/i18n/types.ts`:
  - **Phải cập nhật đầy đủ và đồng thời** vào cả 4 file locale trên.
  - Bản dịch phải tự nhiên, chuyên nghiệp đúng thuật ngữ tài chính / quantitative trading của từng ngôn ngữ.
  - Cấm để sót key trống, cấm để key tiếng Anh lẫn vào file tiếng Việt hoặc ngược lại.

---

## 3. Localization Hygiene & Template Variables
- Khi một chuỗi cần chèn số hoặc biến động (ví dụ: `Đã nạp 5000 nến`, `4 đã qua | 0 sắp tới`):
  - **BẮT BUỘC**: Sử dụng cú pháp template `{count}`, `{symbol}`, `{time}` và hàm `formatText(t.key, { count })`.
  - ❌ Không ghép chuỗi: `count + ' đã qua | ' + upcoming + ' sắp tới'`
  - ✅ `formatText(t.calendarStats, { past: pastCount, upcoming: upcomingCount })`

---

## 4. Automated Verification & Scanner Script
- Dự án có script kiểm định chất lượng i18n tự động:
  ```bash
  npm run check:i18n
  ```
  hoặc
  ```bash
  npx tsx scripts/check-i18n.ts
  ```
- Script này tự động quét:
  1. Mọi ký tự tiếng Việt có dấu (`àáảã...`) còn sót trong `src/components/`.
  2. Mọi key trong `src/i18n/types.ts` bị thiếu trong bất kỳ file nào trong 4 locale (`vi`, `en`, `ja`, `zh`).
- Trước khi kết thúc task hoặc tạo commit, **script này phải vượt qua 100% với 0 lỗi**.

---

## 5. Git Policy Reminder
- **Luôn tạo local commit** sau khi hoàn thành công việc.
- **TUYỆT ĐỐI KHÔNG PUSH (`git push`)** lên remote repository nếu không có yêu cầu rõ ràng từ người dùng.
