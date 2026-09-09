# 📋 QuantBacktest Pro - Danh Mục Tính Năng & Checklist Kiểm Thử Toàn Diện

> **Tài Liệu Kỹ Thuật Tổng Hợp, Bản Đồ Điều Hướng Giao Diện (UI Navigation Map), Danh Mục Mã Nguồn & Tiêu Chí Kiểm Thử Nghiệm Thu (QA Acceptance Checklist)**  
> *Đối tượng sử dụng: Người Dùng / Nhà Giao Dịch, Đội Ngũ Lập Trình Viên & Kỹ Sư Kiểm Thử QA / Tester*  
> *Ngôn ngữ: Tiếng Việt (Bản chuẩn hóa) | [English Edition](docs/FEATURE_CATALOG_CHECKLIST.md)*

---

## 🎯 Mục Lục & Tổng Quan Hệ Thống

Tài liệu này là **nguồn thông tin chuẩn mực duy nhất (Single Source of Truth)** thống kê toàn bộ **48 tính năng trên 8 phân hệ kiến trúc cốt lõi** của nền tảng **QuantBacktest Pro**.

| Mã Phân Hệ | Tên Phân Hệ Nghiệp Vụ | Số Tính Năng | Thành Phần Mã Nguồn Cốt Lõi |
| :--- | :--- | :---: | :--- |
| **`F-HDR`** | [1. Thanh Header & Điều Khiển Không Gian Làm Việc](#1-thanh-header--điều-khiển-không-gian-làm-việc-f-hdr) | 8 | `src/components/header/Header.tsx`, `src/components/header/SymbolSearchModal.tsx` |
| **`F-CHT`** | [2. Đồ Thị Nến Tương Tác & Công Cụ Trục Giá](#2-đồ-thị-nến-tương-tác--công-cụ-trục-giá-f-cht) | 7 | `src/components/chart/TradingViewChart.tsx`, `src/components/chart/VisualChartTradingOverlay.tsx`, `src/components/chart/PriceScaleContextMenu.tsx` |
| **`F-RPL`** | [3. Cỗ Máy Tua Nến Lịch Sử Time-Travel](#3-cỗ-máy-tua-nến-lịch-sử-time-travel-f-rpl) | 4 | `src/components/replay/ReplayBar.tsx`, `src/engine/resampler.ts` |
| **`F-OMS`** | [4. Bộ Máy Khớp Lệnh (OMS) & Bảng Lệnh Dưới Cùng](#4-bộ-máy-khớp-lệnh-oms--bảng-lệnh-dưới-cùng-f-oms) | 9 | `src/components/chart/QuickTradeDock.tsx`, `src/components/panels/OrderEntryModal.tsx`, `src/components/panels/PositionsTable.tsx` |
| **`F-DAT`** | [5. Quản Lý Dữ Liệu 2.0 & Thư Viện SQLite](#5-quản-lý-dữ-liệu-20--thư-viện-sqlite-f-dat) | 5 | `src/components/panels/DataImportModal.tsx`, `src/engine/csvParser.ts`, `src/engine/dataCrawler.ts` |
| **`F-STR`** | [6. AI Strategy Studio, Tối Ưu Hóa & Xuất Bot](#6-ai-strategy-studio-tối-ưu-hóa--xuất-bot-f-str) | 14 | `src/components/panels/AIStrategyModal.tsx`, `src/engine/strategyOptimizer.ts`, `src/engine/strategyExporter.ts` |
| **`F-ANL`** | [7. Báo Cáo Định Lượng & Mô Phỏng Monte Carlo](#7-báo-cáo-định-lượng--mô-phỏng-monte-carlo-f-anl) | 5 | `src/components/panels/AnalyticsDashboardModal.tsx`, `src/engine/analytics.ts` |
| **`F-SYS`** | [8. Kết Nối Sàn MT5, Cloud Tunnel & Hạ Tầng](#8-kết-nối-sàn-mt5-cloud-tunnel--hạ-tầng-f-sys) | 6 | `src/components/panels/BrokerConnectionModal.tsx`, `src/components/panels/TunnelModal.tsx`, `src/components/panels/SessionManagerModal.tsx` |

---

## 1. Thanh Header & Điều Khiển Không Gian Làm Việc (`F-HDR`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-HDR-01` | Tìm Kiếm & Chọn Cặp Tiền | `Symbol Picker` / `Chọn Cặp Tiền` | Header Topbar ➔ Bấm vào nút Cặp tiền (Ví dụ: `XAUUSD`) | `src/components/header/SymbolSearchModal.tsx` |
| `F-HDR-02` | Bộ Chuyển Khung Thời Gian | `Timeframe Pills (M1 - MN)` / `Khung Thời Gian` | Header Topbar ➔ Nhóm nút tròn `[M1, M5, M15, M30, H1, H4, D1, W1, MN]` | `src/components/header/Header.tsx:L190`, `src/engine/resampler.ts` |
| `F-HDR-03` | Chuyển Đổi Kiểu Biểu Đồ | `Candles / Heikin-Ashi` / `Nến Thường / Heikin-Ashi` | Header Topbar ➔ Menu Icon dạng nến bên cạnh Timeframe | `src/components/header/Header.tsx:L240`, `src/components/chart/TradingViewChart.tsx` |
| `F-HDR-04` | Quản Lý Chỉ Báo Kỹ Thuật | `Indicators` / `Chỉ Báo` | Header Topbar ➔ Nút `Chỉ báo [f(x)]` | `src/components/header/Header.tsx:L280`, `src/engine/indicators.ts` |
| `F-HDR-05` | Hiển Thị Spread & Giá Bid/Ask | `Spread: X.X pips (Ask/Bid)` / `Spread: X.X pips` | Header Topbar ➔ Thẻ thông tin Spread | `src/components/header/Header.tsx:L340`, `src/components/chart/TradingViewChart.tsx` |
| `F-HDR-06` | Bảng Quản Lý Vốn & Ký Quỹ | `Balance / Equity / Margin` / `Số Dư / Vốn / Ký Quỹ` | Header Topbar ➔ Cụm số dư & Nút Đặt lại số dư | `src/components/header/Header.tsx:L370`, `src/store/backtestStore.ts` |
| `F-HDR-07` | Chuyển Đổi Ngôn Ngữ Đa Quốc Gia | `Language Menu (EN/VI/JA/ZH)` / `Chuyển Đổi Ngôn Ngữ` | Header Topbar ➔ Menu cờ / ngôn ngữ góc trên bên phải | `src/components/header/Header.tsx:L450`, `src/i18n/` |
| `F-HDR-08` | Hồ Sơ Người Dùng & Xác Thực | `Login / Profile [Pro]` / `Đăng Nhập / Hồ Sơ` | Header Topbar ➔ Nút Avatar / Đăng nhập góc ngoài cùng bên phải | `src/components/auth/AuthModal.tsx`, `src/components/auth/UserProfileModal.tsx` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-HDR-01` - Tìm Kiếm & Chọn Cặp Tiền (Symbol Picker)
- **Điều hướng:** Bấm trực tiếp vào tên cặp tiền đang hiển thị trên Header (ví dụ `XAUUSD`).
- **Chức năng:** Tìm kiếm nhanh, lọc theo danh mục: Forex Majors, Ngoại hối chéo, Kim loại (`XAUUSD`, `XAGUSD`), Tiền điện tử (`BTCUSDT`, `ETHUSDT`).
- **QA Checklist:**
  1. Bấm vào cặp tiền -> Modal mở ra ngay lập tức, con trỏ tự động nằm ở ô tìm kiếm.
  2. Gõ `XAG` -> Danh sách lọc ra `XAGUSD (Bạc Giao Ngay)`.
  3. Chọn `XAGUSD` -> Đồ thị đổi cặp tiền, tính lại giá trị pip, spread và vẽ lại nến chính xác.

#### `F-HDR-02` - Bộ Chuyển Khung Thời Gian (Resampler)
- **Điều hướng:** Bấm vào bất kỳ nút khung thời gian nào trên Header (`M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D1`, `W1`, `MN`).
- **Chức năng:** Tự động tổng hợp nến gốc M1 sang các khung lớn hơn với thuật toán $O(N)$ tức thời.
- **QA Checklist:**
  1. Chuyển từ `M1` sang `M15` -> 15 nến M1 được gộp thành 1 nến M15 chuẩn xác.
  2. Kiểm tra tính bất biến: Giá Open nến M15 bằng Open nến M1 đầu tiên, Close bằng Close nến M1 cuối cùng, High bằng đỉnh cao nhất và Low bằng đáy thấp nhất.

#### `F-HDR-03` - Chuyển Đổi Kiểu Biểu Đồ (Nến Thường vs Heikin-Ashi)
- **Điều hướng:** Bấm vào menu nến trên Header -> Chọn `Nến Thường` hoặc `Heikin-Ashi`.
- **Chức năng:** Chuyển đổi công thức làm mượt Heikin-Ashi (`haClose = (O+H+L+C)/4`, `haOpen = (prevO+prevC)/2`).
- **QA Checklist:**
  1. Chọn `Heikin-Ashi` -> Thân nến được làm mượt xu hướng rõ rệt.
  2. Chọn lại `Nến Thường` -> Đồ thị quay về nến nguyên bản tức thì.

#### `F-HDR-04` - Quản Lý Chỉ Báo Kỹ Thuật (Indicators Popover)
- **Điều hướng:** Bấm nút `Chỉ Báo` (hoặc phím tắt `M`) trên Header.
- **Chức năng:** Bật/tắt và cấu hình: SMA, EMA (9, 21, 50, 200), RSI (14), MACD (12, 26, 9), Bollinger Bands (20, 2) và ATR (14).
- **QA Checklist:**
  1. Mở bảng chỉ báo -> Chọn `EMA 21` và `RSI 14`.
  2. Đường EMA xuất hiện trên biểu đồ chính, khung phụ RSI xuất hiện bên dưới với ngưỡng 30/70.

#### `F-HDR-05` - Hiển Thị Spread & Giá Bid/Ask
- **Điều hướng:** Thẻ hiển thị ở phần giữa-trái của Header.
- **Chức năng:** Tính toán giá Ask theo thời gian thực (`Ask = Bid + Spread * PipSize`) và thể hiện số pip giãn nở.
- **QA Checklist:**
  1. Điều chỉnh Spread từ `1.5` lên `3.0` pips -> Đường giá Ask màu đỏ trên đồ thị dịch chuyển lên trên tương ứng.

#### `F-HDR-06` - Bảng Quản Lý Vốn & Ký Quỹ (Balance HUD)
- **Điều hướng:** Nằm ở góc giữa-phải của Header.
- **Chức năng:** Theo dõi Số dư (Balance), Tài sản (Equity), Ký quỹ đã dùng (Used Margin), Mức ký quỹ (Margin Level). Có nút Đặt lại vốn 1-Click.
- **QA Checklist:**
  1. Khớp 1 lệnh có lãi -> Equity tăng tương ứng với floating PnL.
  2. Bấm nút `Đặt lại vốn` -> Đưa tài khoản về $10,000 mặc định và đóng toàn bộ vị thế.

#### `F-HDR-07` - Chuyển Đổi Ngôn Ngữ Đa Quốc Gia
- **Điều hướng:** Menu dropdown ngôn ngữ ở góc trên bên phải Header.
- **Chức năng:** Hỗ trợ 4 ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Nhật, Tiếng Trung với 100% Locale Parity, không có lỗi fallback chuỗi.
- **QA Checklist:**
  1. Chọn `English` -> Toàn bộ nhãn, nút bấm, modal chuyển sang tiếng Anh.
  2. Chọn `Tiếng Việt` -> Toàn bộ giao diện chuyển về tiếng Việt tức thì không cần tải lại trang.

#### `F-HDR-08` - Hồ Sơ Người Dùng & Xác Thực
- **Điều hướng:** Bấm nút Avatar / Tài khoản ở góc ngoài cùng bên phải Header.
- **Chức năng:** Đăng nhập, đăng ký tài khoản, phân quyền hạng `INSTITUTIONAL`, quản lý khóa bảo mật.
- **QA Checklist:**
  1. Đăng nhập bằng `institutional-user@quantbacktest.pro` -> Huy hiệu `INSTITUTIONAL` xuất hiện trên Header.

---

## 2. Đồ Thị Nến Tương Tác & Công Cụ Trục Giá (`F-CHT`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-CHT-01` | Động Cơ Vẽ Canvas 60 FPS | `TradingView Canvas` / `Biểu Đồ Canvas TradingView` | Khu vực biểu đồ trung tâm màn hình | `src/components/chart/TradingViewChart.tsx` |
| `F-CHT-02` | Kéo Thả Trực Quan SL/TP | `Drag SL/TP Lines` / `Kéo Thả Đường SL/TP` | Bấm vào đường vị thế trên đồ thị ➔ Kéo thả chuột | `src/components/chart/VisualChartTradingOverlay.tsx` |
| `F-CHT-03` | Nút (+) Đặt Lệnh Trực Tiếp | `(+) Limit/Stop Order Button` / `Nút (+) Đặt Lệnh Trục Giá` | Rê chuột lên thanh trục giá bên phải ➔ Bấm `(+)` | `src/components/chart/TradingViewChart.tsx:L820` |
| `F-CHT-04` | Menu Chuột Phải Trục Giá | `Price Scale Options` / `Menu Trục Giá Chuột Phải` | Nhấp chuột phải lên thanh trục giá bên phải | `src/components/chart/PriceScaleContextMenu.tsx` |
| `F-CHT-05` | Bộ Công Cụ Vẽ Kỹ Thuật | `Drawing Toolbar` / `Thanh Công Cụ Vẽ Kỹ Thuật` | Thanh công cụ vẽ dạng nổi bên trái đồ thị | `src/components/chart/DrawingCanvas.tsx` |
| `F-CHT-06` | Đường Đỉnh/Đáy & Phân Cách Ngày | `High/Low Lines & Separators` / `Đường Đỉnh/Đáy & Phân Cách Ngày` | Vẽ tự động theo các phiên giao dịch | `src/components/chart/TradingViewChart.tsx:L450` |
| `F-CHT-07` | Lá Chắn Thi Quỹ Prop Firm HUD | `Prop Firm Shield HUD` / `Lá Chắn Thi Quỹ Prop Firm` | Thẻ nổi góc trên bên phải biểu đồ | `src/components/chart/PropFirmHUD.tsx`, `src/store/slices/createPropFirmSlice.ts` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-CHT-01` - Động Cơ Vẽ Canvas 60 FPS
- **Điều hướng:** Khu vực đồ thị trung tâm. Kéo chuột để di chuyển (pan), lăn con trỏ để thu phóng (zoom).
- **Chức năng:** Nền tảng TradingView Lightweight Charts v4. Cập nhật nến $O(1)$ chỉ mất < 0.05ms mỗi tick.
- **QA Checklist:** Tải 50,000 - 200,000 nến -> Thu phóng và cuộn nến ở tốc độ cao đạt mượt mà 60 FPS.

#### `F-CHT-02` - Kéo Thả Trực Quan SL/TP Trên Biểu Đồ
- **Điều hướng:** Khi có lệnh đang mở -> Bấm vào đường Stop Loss (đỏ) hoặc Take Profit (xanh) và kéo thả trực tiếp trên đồ thị.
- **Chức năng:** Cập nhật giá dừng lỗ/chốt lời trực quan kèm hiển thị số pip và số tiền rủi ro ước tính.
- **QA Checklist:** Kéo đường SL dịch ra xa 20 pips -> Thả chuột -> Bảng Positions cập nhật mức giá SL mới ngay lập tức.

#### `F-CHT-03` - Nút (+) Đặt Lệnh Trực Tiếp Trên Trục Giá
- **Điều hướng:** Rê chuột dọc theo trục giá bên phải -> Nút `(+)` màu xanh dương chạy bám theo vị trí chuột -> Bấm chuột vào `(+)`.
- **Chức năng:** Tự động mở modal đặt lệnh Limit hoặc Stop tại mức giá chính xác nơi con trỏ đang chỉ.
- **QA Checklist:** Rê chuột đến mức giá 2650.0 trên cặp Vàng -> Bấm `(+)` -> Modal Order Entry điền sẵn giá 2650.0.

#### `F-CHT-04` - Menu Chuột Phải Trục Giá (Price Scale Context Menu)
- **Điều hướng:** Nhấp chuột phải vào bất kỳ vị trí nào trên trục giá bên phải biểu đồ.
- **Chức năng:** Cung cấp các tùy chọn: `Tự Động Căn Chỉnh (Fit Data)`, `Thang Đo Phần Trăm (%)`, `Thang Đo Logarithmic`, `Đếm Ngược Đóng Nến`, và `Đặt Lại Thang Đo`.
- **QA Checklist:** Chọn `Thang đo Logarithmic` -> Trục giá chuyển sang tỷ lệ logarit chuẩn xác.

#### `F-CHT-05` - Bộ Công Cụ Vẽ Kỹ Thuật (Drawing Canvas)
- **Điều hướng:** Thanh công cụ nổi ở mép trái biểu đồ.
- **Chức năng:** Cung cấp Con trỏ (Crosshair), Đường xu hướng (Trendline), Đường ngang (Horizontal Line), Tia (Ray), Hộp chữ nhật (Rectangle Box), Thước đo Fibonacci và Nút xóa toàn bộ.
- **QA Checklist:** Chọn `Thước đo Fibonacci Retracement` -> Kéo từ đáy lên đỉnh -> Các mức 0.382, 0.5, 0.618 hiển thị chính xác.

#### `F-CHT-06` - Đường Đỉnh/Đáy & Phân Cách Ngày
- **Điều hướng:** Tự động vẽ trên biểu đồ hoặc bật/tắt trong cài đặt.
- **Chức năng:** Hiển thị vạch kẻ đứng lúc 00:00 UTC phân tách các ngày giao dịch và các vạch ngang ngắt quãng thể hiện đỉnh cao nhất và đáy thấp nhất phiên.
- **QA Checklist:** Kiểm tra các đường phân cách ngày khớp đúng thời khắc giao thừa 00:00 UTC.

#### `F-CHT-07` - Lá Chắn Thi Quỹ Prop Firm HUD
- **Điều hướng:** Thẻ nổi ở góc trên bên phải đồ thị. Bấm biểu tượng bánh răng để chỉnh tham số quỹ.
- **Chức năng:** Giám sát thời gian thực Sụt giảm ngày tối đa (Mặc định 5%) và Sụt giảm tài khoản tối đa (Mặc định 10%). Kích hoạt còi báo động và ngắt giao dịch khi vi phạm.
- **QA Checklist:** Tạo khoản lỗ giả lập 5.1% -> HUD lập tức chuyển sang màu đỏ cảnh báo và khóa quyền vào lệnh mới.

---

## 3. Cỗ Máy Tua Nến Lịch Sử Time-Travel (`F-RPL`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-RPL-01` | Điều Khiển Tua Nến 60 FPS | `Play / Pause / Step [F8]` / `Phát / Tạm Dừng / Từng Bước` | Thanh Replay nổi phía dưới màn hình ➔ Nút Phát, Dừng, Bước | `src/components/replay/ReplayBar.tsx` |
| `F-RPL-02` | Thanh Điều Chỉnh Tốc Độ Tua | `Speed Slider (0.1x - 100x)` / `Tốc Độ Tua` | Thanh Replay ➔ Nút chọn tốc độ & Thanh trượt | `src/components/replay/ReplayBar.tsx:L120` |
| `F-RPL-03` | Nhảy Nhanh Mốc Dữ Liệu | `Start / Mid / Latest` / `Đầu / Giữa 50% / Mới Nhất` | Thanh Replay ➔ Các nút mốc `[0%, 50%, 100%]` | `src/components/replay/ReplayBar.tsx:L180` |
| `F-RPL-04` | Tua Nến Chính Xác Ngày Giờ | `Jump to Date/Time [Calendar]` / `Tua Đến Ngày Giờ` | Thanh Replay ➔ Bấm vào ô hiển thị ngày giờ ➔ Chọn giờ ➔ `Nhảy` | `src/components/replay/ReplayBar.tsx:L220` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-RPL-01` - Điều Khiển Tua Nến 60 FPS
- **Điều hướng:** Thanh nổi phía dưới đồ thị. Phím tắt: `Space` (Phát/Dừng), `F8` hoặc `Mũi tên phải` (Tua 1 nến), `Mũi tên trái` (Lùi 1 nến), `Reset` (Quay lại đầu).
- **Chức năng:** Mô phỏng từng tick nến thời gian thực và kích hoạt bộ máy khớp lệnh OMS tại mỗi bước nến.
- **QA Checklist:** Nhấn `Space` -> Nến bắt đầu chạy mượt mà. Nhấn `F8` -> Chỉ nhảy thêm đúng 1 nến.

#### `F-RPL-02` - Thanh Điều Chỉnh Tốc Độ Tua
- **Điều hướng:** Các nút tốc độ trên thanh Replay: `0.5x`, `1x`, `5x`, `10x`, `50x`, `100x`.
- **Chức năng:** Điều chỉnh chu kỳ phát nến từ 1000ms xuống còn 10ms.
- **QA Checklist:** Chọn `100x` -> 100 nến được tua qua trong 1 giây mà giao diện không hề bị đơ.

#### `F-RPL-03` - Nhảy Nhanh Mốc Dữ Liệu (Milestone Jumps)
- **Điều hướng:** Bấm các nút mốc trên thanh Replay: `Đầu` (0%), `Giữa` (50%), `Mới nhất` (100%).
- **Chức năng:** Lập tức đưa con trỏ tua nến đến vị trí tương ứng trong tập dữ liệu.
- **QA Checklist:** Bấm `50%` -> Biểu đồ lập tức định vị ở điểm chính giữa của toàn bộ lịch sử nến.

#### `F-RPL-04` - Tua Nến Chính Xác Ngày Giờ (Time-Travel Binary Search)
- **Điều hướng:** Bấm vào ô ngày giờ trên thanh Replay -> Chọn Năm, Tháng, Ngày, Giờ, Phút -> Bấm `Nhảy (Jump)`.
- **Chức năng:** Dùng thuật toán Binary Search $O(\log N)$ để tìm nến gần nhất trong vòng < 1ms và dịch chuyển biểu đồ tức thì.
- **QA Checklist:** Chọn ngày `2024-08-07 12:30` (Thời điểm ra tin Non-Farm) -> Đồ thị nhảy chuẩn xác đến đúng nến tin tức ra lò.

---

## 4. Bộ Máy Khớp Lệnh (OMS) & Bảng Lệnh Dưới Cùng (`F-OMS`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-OMS-01` | Bảng Lệnh Nhanh Quick Trade | `Quick Trade Dock` / `Bảng Lệnh Nhanh Quick Trade` | Dock nổi góc trên-trái đồ thị / Nút `Quick Trade` trên Header | `src/components/chart/QuickTradeDock.tsx` |
| `F-OMS-02` | Hộp Thoại Đặt Lệnh Nâng Cao | `Order Entry` / `Đặt Lệnh Nâng Cao` | Header Topbar ➔ Bấm nút `Đặt Lệnh (Order Entry)` | `src/components/panels/OrderEntryModal.tsx`, `src/engine/patterns/OrderFactory.ts` |
| `F-OMS-03` | Quản Lý Vị Thế Đang Mở | `Open Positions Tab` / `Vị Thế Đang Mở` | Bảng dưới cùng ➔ Tab `Vị Thế (Positions)` | `src/components/panels/PositionsTable.tsx:L120` |
| `F-OMS-04` | Quản Lý Lệnh Chờ (Pending) | `Pending Orders Tab` / `Lệnh Chờ (Limit/Stop)` | Bảng dưới cùng ➔ Tab `Lệnh Chờ (Pending Orders)` | `src/components/panels/PositionsTable.tsx:L320` |
| `F-OMS-05` | Sổ Cái Lịch Sử Giao Dịch | `Trade History Tab` / `Lịch Sử Giao Dịch` | Bảng dưới cùng ➔ Tab `Lịch Sử (History)` | `src/components/panels/PositionsTable.tsx:L450` |
| `F-OMS-06` | Nhật Ký Chiến Lược Bot | `Strategy Logs Tab` / `Nhật Ký Chiến Lược Bot` | Bảng dưới cùng ➔ Tab `Nhật Ký Chiến Lược` | `src/components/panels/PositionsTable.tsx:L580` |
| `F-OMS-07` | Lịch Kinh Tế Chuẩn Xác | `Economic Calendar Tab` / `Lịch Kinh Tế` | Bảng dưới cùng ➔ Tab `Lịch Kinh Tế (Calendar)` | `src/components/panels/EconomicCalendarTab.tsx` |
| `F-OMS-08` | Bảng Theo Dõi Thị Trường | `Market Watch Drawer` / `Bảng Theo Dõi Giá` | Bảng dưới cùng ➔ Tab `Theo Dõi (Market Watch)` | `src/components/panels/MarketWatchDrawer.tsx` |
| `F-OMS-09` | Nút Đóng Khẩn Cấp Tất Cả Lệnh | `Close All Button` / `Đóng Tất Cả Vị Thế` | Bảng dưới cùng ➔ Nút màu đỏ `Đóng Tất Cả Lệnh` | `src/components/panels/PositionsTable.tsx:L85` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-OMS-01` - Bảng Lệnh Nhanh Quick Trade Dock
- **Điều hướng:** Bảng nổi ở góc trên-trái biểu đồ. Nút lớn `BUY` (Xanh) và `SELL` (Đỏ), các mức lot mẫu (`0.01`, `0.1`, `1.0`), ô nhập SL/TP theo pips, huy hiệu tỷ lệ R:R tự động.
- **Chức năng:** Khớp lệnh thị trường 1-click tức thì kèm chi phí chênh lệch giá Bid/Ask thực tế.
- **QA Checklist:** Đặt Auto SL = 15 pips, Auto TP = 30 pips -> Bấm BUY -> Lệnh mở tức thì với tỷ lệ R:R = 1:2.

#### `F-OMS-02` - Hộp Thoại Đặt Lệnh Nâng Cao (Order Entry Modal)
- **Điều hướng:** Bấm nút `Đặt Lệnh (Order Entry)` trên Header (hoặc phím tắt `B`/`S`).
- **Chức năng:** Cho phép chọn loại lệnh: Market, Limit, Stop. Tự động tính toán ký quỹ yêu cầu, giá trị pip và kiểm tra đòn bẩy trước khi đặt lệnh thông qua `OrderFactory`.
- **QA Checklist:** Đặt lệnh Buy Limit thấp hơn giá thị trường -> Lệnh chuyển sang nằm chờ trong tab `Lệnh Chờ`.

#### `F-OMS-03` - Quản Lý Vị Thế Đang Mở (Positions Tab)
- **Điều hướng:** Bảng điều khiển dưới cùng -> Tab `Vị Thế`.
- **Chức năng:** Hiển thị chi tiết từng lệnh: Cặp tiền, Chiều (Buy/Sell), Khối lượng Lot, Giá vào, Giá hiện tại, Lãi lỗ thả nổi. Các nút thao tác nhanh:
  - `Set BE`: Đưa Stop Loss về mức Hòa Vốn + 1 pip.
  - `Đóng 50%`: Cắt nửa khối lượng và chốt một phần lợi nhuận.
  - `Chỉnh SL/TP`: Điều chỉnh mức giá dừng lỗ/chốt lời.
  - `Ghi Chú & Tag`: Gắn nhãn chiến lược và lưu nhật ký tâm lý giao dịch.
- **QA Checklist:** Bấm `Set BE` trên lệnh đang có lãi -> Mức SL được đẩy lên trên giá Entry 0.1 pip.

#### `F-OMS-04` - Quản Lý Lệnh Chờ (Pending Orders)
- **Điều hướng:** Bảng dưới cùng -> Tab `Lệnh Chờ`.
- **Chức năng:** Quản lý các lệnh Buy/Sell Limit và Buy/Sell Stop đang chờ khớp. Hỗ trợ hủy lệnh hoặc sửa giá kích hoạt.
- **QA Checklist:** Khi giá tua đến mức giá đặt limit -> Lệnh tự động kích hoạt và chuyển sang tab `Vị Thế`.

#### `F-OMS-05` - Sổ Cái Lịch Sử Giao Dịch (History Tab)
- **Điều hướng:** Bảng dưới cùng -> Tab `Lịch Sử`.
- **Chức năng:** Thống kê toàn bộ các lệnh đã đóng: Thời gian mở/đóng, Thời gian giữ lệnh, Lợi nhuận gộp/ròng, Phí hoa hồng ($7/lot) và Lý do thoát lệnh (`TP`, `SL`, hay `Thị trường`).
- **QA Checklist:** Xác nhận Lợi nhuận ròng = Lợi nhuận gộp - Phí hoa hồng.

#### `F-OMS-06` - Nhật Ký Chiến Lược Bot (Strategy Logs Tab)
- **Điều hướng:** Bảng dưới cùng -> Tab `Nhật Ký Chiến Lược`.
- **Chức năng:** Luồng log thời gian thực ghi lại các sự kiện tính toán của thuật toán bot, tín hiệu Buy/Sell và cảnh báo lỗi.
- **QA Checklist:** Cho bot chạy tự động -> Log phát tín hiệu xuất hiện liên tục trong bảng theo từng nến.

#### `F-OMS-07` - Lịch Kinh Tế Chuẩn Xác & Đồng Bộ
- **Điều hướng:** Bảng dưới cùng -> Tab `Lịch Kinh Tế`.
- **Chức năng:** Bảng tin vĩ mô thế giới (Non-Farm, CPI, Lãi suất FED, GDP) kèm bộ lọc mức độ ảnh hưởng (Đỏ, Cam, Vàng), bộ lọc đồng tiền, đếm ngược thời gian và sắp xếp tin mới nhất lên đầu.
- **QA Checklist:** Chọn lọc `Ảnh hưởng cao` & đồng `USD` -> Bảng chỉ hiển thị tin CPI, NFP và họp FOMC.

#### `F-OMS-08` - Bảng Theo Dõi Thị Trường (Market Watch Drawer)
- **Điều hướng:** Bảng dưới cùng -> Tab `Theo Dõi`.
- **Chức năng:** Danh sách theo dõi các cặp tiền hiển thị giá Bid, Ask, Spread và phần trăm biến động trong ngày.
- **QA Checklist:** Bấm đúp vào 1 dòng trong bảng -> Biểu đồ chuyển sang cặp tiền đó ngay lập tức.

#### `F-OMS-09` - Nút Đóng Khẩn Cấp Tất Cả Lệnh (Close All)
- **Điều hướng:** Nút màu đỏ ở góc trên bên phải của bảng lệnh dưới cùng (hoặc phím tắt `C`).
- **Chức năng:** Lập tức quét và đóng toàn bộ các vị thế đang mở trên thị trường cùng một lúc.
- **QA Checklist:** Mở 3 lệnh -> Bấm `Đóng Tất Cả Lệnh` -> Cả 3 lệnh được đóng đồng loạt và ghi vào Lịch Sử.

---

## 5. Quản Lý Dữ Liệu 2.0 & Thư Viện SQLite (`F-DAT`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-DAT-01` | Bộ Đọc CSV Số Nguyên Siêu Tốc | `Upload CSV File` / `Tải Lên File CSV` | Header ➔ `Công Cụ Khác [•••]` ➔ `Quản Lý Dữ Liệu` ➔ Tab `Tải Lên` | `src/engine/csvParser.ts`, `src/components/panels/DataImportModal.tsx` |
| `F-DAT-02` | Thư Viện Dataset SQLite | `Dataset Library` / `Thư Viện Dữ Liệu SQLite` | Header ➔ `Công Cụ Khác [•••]` ➔ `Quản Lý Dữ Liệu` ➔ Tab `Thư Viện` | `src/components/panels/DataImportModal.tsx:L250` |
| `F-DAT-03` | Crawler Thu Thập Trực Tuyến | `Online Crawler` / `Thu Thập Trực Tuyến` | Header ➔ `Công Cụ Khác [•••]` ➔ `Quản Lý Dữ Liệu` ➔ Tab `Crawler` | `src/engine/dataCrawler.ts`, `src/components/panels/DataImportModal.tsx:L400` |
| `F-DAT-04` | Chế Độ Thu Thập Theo Khoảng Ngày | `Custom Date Range` / `Khoảng Ngày Tùy Chọn` | Trong Tab Crawler ➔ Bật `Chọn Khoảng Ngày` | `src/components/panels/DataImportModal.tsx:L480` |
| `F-DAT-05` | Dữ Liệu Chuẩn Mẫu Kaggle | `Kaggle Presets` / `Dữ Liệu Mẫu Kaggle` | Trong Modal Dữ Liệu ➔ Tab `Dữ Liệu Mẫu` | `src/components/panels/DataImportModal.tsx:L600` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-DAT-01` - Bộ Đọc CSV Số Nguyên Siêu Tốc (Fast CSV Parser)
- **Điều hướng:** Modal Quản lý dữ liệu -> Tab `Tải Lên` -> Kéo thả file `.csv`.
- **Chức năng:** Bộ phân tích tùy chỉnh đọc 1.44 triệu nến trong < 3.8s. Tự nhận diện dấu phân cách (`,`, `;`, `\t`) và định dạng ngày tháng.
- **QA Checklist:** Nạp file MT5 CSV dung lượng 74MB -> Thanh tiến trình hoàn tất dưới 4 giây và hiển thị bảng xem trước nến.

#### `F-DAT-02` - Thư Viện Dataset SQLite (Card Grid)
- **Điều hướng:** Modal Quản lý dữ liệu -> Tab `Thư Viện`.
- **Chức năng:** Thẻ trực quan của toàn bộ các bộ dữ liệu đã lưu trong SQLite. Hiển thị Cặp tiền, Khung thời gian, Số lượng nến, Khoảng ngày và Nút `Nạp Lên Biểu Đồ` 1-Click.
- **QA Checklist:** Bấm nút `Nạp` trên bất kỳ thẻ dữ liệu nào -> Đồ thị đổi dữ liệu tức thì không cần tải lại file.

#### `F-DAT-03` - Crawler Thu Thập Trực Tuyến Phân Trang
- **Điều hướng:** Modal Quản lý dữ liệu -> Tab `Crawler` -> Chọn Tài sản (Crypto, Vàng, Forex) -> Chọn số lượng nến (1,000 đến 50,000).
- **Chức năng:** Tự động kéo dữ liệu nến OHLCV lịch sử từ Binance REST API và các sàn giao dịch.
- **QA Checklist:** Yêu cầu 5,000 nến `BTCUSDT` -> Hệ thống kéo đủ 5,000 nến và tự động lưu vào cơ sở dữ liệu SQLite.

#### `F-DAT-04` - Chế Độ Thu Thập Theo Khoảng Ngày
- **Điều hướng:** Tab Crawler -> Chọn `Từ ngày` và `Đến ngày` -> Bấm `Tải Dữ Liệu`.
- **Chức năng:** Tải chính xác từng khoảng thời gian chỉ định kèm thanh phần trăm tiến trình thực tế.
- **QA Checklist:** Chọn khoảng thời gian tháng trước -> Kiểm tra đủ nến các ngày làm việc trong tháng.

#### `F-DAT-05` - Dữ Liệu Chuẩn Mẫu Kaggle
- **Điều hướng:** Modal Quản lý dữ liệu -> Tab `Dữ Liệu Mẫu`.
- **Chức năng:** Cung cấp sẵn các bộ dữ liệu lịch sử chuẩn nhiều năm cho các cặp chính (`EURUSD`, `GBPUSD`, `XAUUSD`, `BTCUSDT`).
- **QA Checklist:** Bấm `Nạp Vàng 2024` -> Tập dữ liệu xuất hiện trên biểu đồ trong vòng < 500ms.

---

## 6. AI Strategy Studio, Tối Ưu Hóa & Xuất Bot (`F-STR`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-STR-01` | Chuyển Ngôn Ngữ Tự Nhiên Sang Code | `AI Strategy Studio` / `Khởi Tạo Chiến Lược AI` | Header Topbar ➔ Bấm nút `AI Studio` | `src/components/panels/AIStrategyModal.tsx`, `src/engine/aiService.ts` |
| `F-STR-02` | Thẻ Tóm Tắt Quy Tắc Vào Lệnh | `Rule Breakdown Cards` / `Thẻ Quy Tắc Vào Lệnh` | Trong Modal AI Studio ➔ Tab `Chiến Lược` | `src/components/panels/AIStrategyModal.tsx:L320` |
| `F-STR-03` | Môi Trường Thực Thi Cách Ly Sandbox | `Run Sandbox Backtest` / `Chạy Thử Chiến Lược` | Trong Modal AI Studio ➔ Bấm `Chạy Backtest` | `src/engine/strategySandbox.ts` |
| `F-STR-04` | Kết Nối Đa Mô Hình Ngôn Ngữ (LLMs) | `AI Model Settings` / `Cấu Hình Mô Hình AI` | Trong Modal AI Studio ➔ Biểu tượng Bánh răng Cài đặt | `src/engine/aiService.ts:L80` |
| `F-STR-05` | Bảng Điều Khiển Bot Live Trên Đồ Thị | `AI Bot HUD Overlay` / `Bảng Điều Khiển Bot Live` | Khu vực biểu đồ ➔ Bảng nổi AI Bot HUD | `src/components/panels/AIBotHUD.tsx` |
| `F-STR-06` | Bộ Tối Ưu Tham Số Quét Lưới SL/TP | `Grid Search Optimizer` / `Tối Ưu Hóa Tham Số SL/TP` | Trong Modal AI Studio ➔ Tab `Bộ Tối Ưu` | `src/engine/strategyOptimizer.ts` |
| `F-STR-07` | Ma Trận Nhiệt Lợi Nhuận 2D | `2D Profit Heatmap` / `Ma Trận Nhiệt Lợi Nhuận 2D` | Trong Tab Bộ Tối Ưu ➔ Biểu Đồ Nhiệt 2D | `src/components/panels/AIStrategyModal.tsx:L750` |
| `F-STR-08` | Kiểm Thử Ngoài Mẫu (Out-of-Sample) | `Walk-Forward OOS Test` / `Kiểm Thử Ngoài Mẫu OOS` | Trong Tab Bộ Tối Ưu ➔ Bật `Xác Thực OOS` | `src/engine/strategyOptimizer.ts:L180` |
| `F-STR-09` | Xuất Chỉ Báo Pine Script v5 | `Export Pine Script v5` / `Xuất Mã TradingView v5` | Trong Modal AI Studio ➔ Tab `Xuất Bot` ➔ `TradingView` | `src/engine/strategyExporter.ts`, `src/components/panels/ExportStrategyModal.tsx` |
| `F-STR-10` | Xuất Robot MT5 (MQL5 EA) | `Export MetaTrader 5 (MQL5)` / `Xuất Bot MT5 MQL5` | Trong Tab Xuất Bot ➔ `MetaTrader 5` | `src/engine/strategyExporter.ts:L120` |
| `F-STR-11` | Xuất Robot MT4 (MQL4 EA) | `Export MetaTrader 4 (MQL4)` / `Xuất Bot MT4 MQL4` | Trong Tab Xuất Bot ➔ `MetaTrader 4` | `src/engine/strategyExporter.ts:L240` |
| `F-STR-12` | Xuất Bot Python CCXT Độc Lập | `Export Python Bot (CCXT)` / `Xuất Bot Python 3` | Trong Tab Xuất Bot ➔ `Python CCXT` | `src/engine/strategyExporter.ts:L360` |
| `F-STR-13` | Xuất Robot cTrader (C# cBot) | `Export cTrader (C#)` / `Xuất Robot cTrader` | Trong Tab Xuất Bot ➔ `cTrader` | `src/engine/strategyExporter.ts:L480` |
| `F-STR-14` | Xuất Gói Cấu Hình Universal JSON | `Export Strategy JSON` / `Xuất Gói Cấu Hình JSON` | Trong Tab Xuất Bot ➔ `Universal JSON` | `src/engine/strategyExporter.ts:L560` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-STR-01` - Chuyển Ngôn Ngữ Tự Nhiên Sang Code Thuật Toán
- **Điều hướng:** Bấm nút `AI Studio` trên Header -> Nhập câu mô tả chiến lược bằng tiếng Việt hoặc tiếng Anh.
- **Chức năng:** Tự động sinh mã nguồn TypeScript hoàn chỉnh cho chiến lược giao dịch định lượng.
- **QA Checklist:** Nhập prompt: *"EMA 9 cắt lên EMA 21, RSI < 70 thì Buy, SL 15 pips, TP 30 pips"* -> Code sinh ra biên dịch 0 lỗi.

#### `F-STR-02` - Thẻ Tóm Tắt Quy Tắc Vào Lệnh (Rule Breakdown Cards)
- **Điều hướng:** Nằm ở phía trên trình soạn thảo code trong Modal AI Studio.
- **Chức năng:** Bóc tách logic code thành 3 thẻ trực quan: `Điều Kiện Mua (BUY)`, `Điều Kiện Bán (SELL)`, và `Quản Trị Rủi Ro & Khối Lượng`.
- **QA Checklist:** Sửa đổi code -> Các thẻ tóm tắt tự động cập nhật nội dung tương ứng.

#### `F-STR-03` - Môi Trường Thực Thi Cách Ly Sandbox (OWASP Hardened)
- **Điều hướng:** Bấm nút `Chạy Backtest` trong Modal AI Studio.
- **Chức năng:** Sandbox cô lập hoàn toàn. Ngăn chặn Prototype Pollution, chặn truy cập biến toàn cục nguy hiểm (`window`, `localStorage`, `fetch`) và dập tắt vòng lặp vô hạn (`while(true)`).
- **QA Checklist:** Chèn mã độc hại thử nghiệm -> Sandbox từ chối thực thi và thông báo lỗi rõ ràng.

#### `F-STR-04` - Kết Nối Đa Mô Hình Ngôn Ngữ (Multi-LLM Connectors)
- **Điều hướng:** Biểu tượng bánh răng Cài đặt trong Modal AI Studio.
- **Chức năng:** Hỗ trợ OpenAI (GPT-4o), Google Gemini, Anthropic Claude, DeepSeek, Local Ollama và Reverse Proxy.
- **QA Checklist:** Chọn Gemini -> Nhập prompt -> Nhận về cấu trúc code chuẩn xác.

#### `F-STR-05` - Bảng Điều Khiển Bot Live Trên Đồ Thị (AIBotHUD)
- **Điều hướng:** Thẻ nổi trên biểu đồ khi một chiến lược bot đang được kích hoạt.
- **Chức năng:** Báo trạng thái bot (`Đang Chạy` / `Tạm Dừng`), tín hiệu vào lệnh thời gian thực, số lệnh đã đánh, PnL ròng và nút tắt bot khẩn cấp.
- **QA Checklist:** Bật bot chạy cùng Replay -> Bảng HUD cập nhật trạng thái tín hiệu tại từng nến.

#### `F-STR-06` - Bộ Tối Ưu Tham Số Quét Lưới SL/TP (Grid Search Optimizer)
- **Điều hướng:** Modal AI Studio -> Tab `Bộ Tối Ưu`.
- **Chức năng:** Quét dải SL (10-50 pips) và TP (20-100 pips) trên hàng trăm tổ hợp tham số.
- **QA Checklist:** Chạy lưới 4x4 -> Bảng kết quả xếp hạng các tổ hợp theo Lợi nhuận và Tỷ lệ thắng.

#### `F-STR-07` - Ma Trận Nhiệt Lợi Nhuận 2D (Profit Heatmap)
- **Điều hướng:** Tab Bộ Tối Ưu -> Ma trận nhiệt bên dưới bảng xếp hạng.
- **Chức năng:** Biểu đồ dải màu xanh/đỏ làm nổi bật các vùng tham số ổn định nhất (*Sweet Spots*) tránh bẫy Overfitting.
- **QA Checklist:** Rê chuột lên một ô nhiệt -> Hiển thị Tooltip giá trị SL, TP, Net PnL và số lệnh.

#### `F-STR-08` - Kiểm Thử Ngoài Mẫu (Out-of-Sample Forward Test)
- **Điều hướng:** Tab Bộ Tối Ưu -> Bật nút `Xác Thực OOS`.
- **Chức năng:** Tách 70% nến đầu để tối ưu hóa và 30% nến sau để kiểm thử ngoài mẫu. Tính chỉ số hiệu quả chuyển tiếp (Walk-Forward Efficiency).
- **QA Checklist:** Xác nhận các lệnh OOS chỉ chạy trên các nến tương lai chưa từng được tối ưu.

#### `F-STR-09` đến `F-STR-14` - Các Bộ Xuất Bot Đa Nền Tảng
- **Điều hướng:** Modal AI Studio -> Tab `Xuất Bot` -> Chọn tab nền tảng tương ứng:
  - **TradingView**: Sinh mã Pine Script v5 kèm cấu trúc Webhook Alert JSON cho 3Commas, Bybit, Binance.
  - **MetaTrader 5**: Sinh mã `.mq5` Expert Advisor chuẩn thư viện `CTrade`.
  - **MetaTrader 4**: Sinh mã `.mq4` EA cổ điển với hàm `OrderSend()`.
  - **Python CCXT**: Sinh script Python 3 hoàn chỉnh chạy 24/7.
  - **cTrader**: Sinh file `.cs` cho cTrader Automate.
  - **Universal JSON**: Xuất gói cấu hình JSON chứa AST chiến lược.
- **QA Checklist:** Bấm `Sao Chép Mã` hoặc `Tải File` -> File biên dịch thành công 0 lỗi trong MetaEditor và TradingView.

---

## 7. Báo Cáo Định Lượng & Mô Phỏng Monte Carlo (`F-ANL`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-ANL-01` | Thống Kê Hiệu Suất Định Lượng | `Analytics Overview` / `Báo Cáo Hiệu Suất Tổng Quan` | Header Topbar ➔ Bấm nút `Phân Tích (Analytics)` | `src/components/panels/AnalyticsDashboardModal.tsx`, `src/engine/analytics.ts` |
| `F-ANL-02` | Mô Phỏng Căng Thẳng Monte Carlo | `Monte Carlo Simulation` / `Mô Phỏng Căng Thẳng Monte Carlo` | Trong Modal Phân Tích ➔ Tab `Monte Carlo` | `src/components/panels/AnalyticsDashboardModal.tsx:L350`, `src/engine/analytics.ts:L220` |
| `F-ANL-03` | Lịch Lãi Lỗ & Biểu Đồ Nhiệt Phiên | `PnL Calendar & Heatmap` / `Lịch Lãi Lỗ & Biểu Đồ Nhiệt Phiên` | Trong Modal Phân Tích ➔ Tab `Biểu Đồ Nhiệt` | `src/components/panels/AnalyticsDashboardModal.tsx:L520` |
| `F-ANL-04` | Đối Chiếu So Sánh Đa Phiên | `Compare Sessions` / `Đối Chiếu Đa Phiên Backtest` | Trong Modal Phân Tích ➔ Tab `So Sánh Phiên` | `src/components/panels/AnalyticsDashboardModal.tsx:L680` |
| `F-ANL-05` | Xuất File CSV & Lưu Ảnh Chụp DB | `Export CSV / Save Snapshot` / `Xuất File CSV / Lưu Ảnh Chụp` | Trong Modal Phân Tích ➔ Cụm nút hành động góc trên phải | `src/components/panels/AnalyticsDashboardModal.tsx:L120` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-ANL-01` - Thống Kê Hiệu Suất Định Lượng (KPIs Overview)
- **Điều hướng:** Bấm nút `Phân Tích (Analytics)` trên Header.
- **Chức năng:** Biểu đồ đường cong tăng trưởng vốn (Equity Curve) và các chỉ số chuẩn tổ chức tài chính: Lợi nhuận ròng, Profit Factor, Tỷ lệ thắng, Kỳ vọng toán học, Sharpe Ratio, Sortino Ratio, Calmar Ratio, SQN và Sụt giảm lớn nhất (Max DD %).
- **QA Checklist:** Xác nhận Sharpe Ratio và Sortino Ratio tính toán chuẩn xác theo công thức định lượng.

#### `F-ANL-02` - Mô Phỏng Căng Thẳng Monte Carlo (1,000 Paths)
- **Điều hướng:** Modal Phân Tích -> Tab `Monte Carlo` -> Bấm `Chạy 1000 Kịch Bản`.
- **Chức năng:** Xáo trộn thứ tự các lệnh giao dịch qua 1,000 lần mô phỏng. Tính toán Xác suất Cháy tài khoản (Risk of Ruin) và khoảng tin cậy 95% / 99%.
- **QA Checklist:** Chạy 1,000 kịch bản -> Xác suất cháy tài khoản nằm trong khoảng [0%, 100%] và hiển thị đường trung vị.

#### `F-ANL-03` - Lịch Lãi Lỗ & Biểu Đồ Nhiệt Phiên Giao Dịch
- **Điều hướng:** Modal Phân Tích -> Tab `Biểu Đồ Nhiệt`.
- **Chức năng:** Phân tích chi tiết hiệu quả theo từng Phiên giao dịch (Á, Âu, Mỹ), từng Thứ trong tuần (Thứ 2 đến Thứ 6) và từng Tháng trong năm.
- **QA Checklist:** Tổng lợi nhuận các ngày cộng lại khớp 100% với Lợi nhuận ròng tổng thể.

#### `F-ANL-04` - Đối Chiếu So Sánh Đa Phiên Backtest
- **Điều hướng:** Modal Phân Tích -> Tab `So Sánh Phiên` -> Chọn các phiên cần đối chiếu.
- **Chức năng:** Đặt cạnh nhau nhiều phiên backtest để so sánh hiệu suất, đường vốn và gắn huy hiệu cho phiên xuất sắc nhất.
- **QA Checklist:** Chọn 2 phiên -> Bảng hiển thị đối chiếu trực diện các chỉ số KPI.

#### `F-ANL-05` - Xuất File CSV & Lưu Ảnh Chụp Database
- **Điều hướng:** Các nút ở góc trên-phải trong Modal Phân Tích.
- **Chức năng:** `Xuất File CSV` tải về toàn bộ lịch sử lệnh để kiểm tra bằng Excel/Python. `Lưu Ảnh Chụp` lưu kết quả vào SQLite.
- **QA Checklist:** Bấm `Xuất File CSV` -> Trình duyệt tải về file `.csv` chứa đầy đủ danh sách lệnh.

---

## 8. Kết Nối Sàn MT5, Cloud Tunnel & Hạ Tầng (`F-SYS`)

### Bảng Thống Kê Phân Hệ
| Mã | Tên Kỹ Thuật | Tên Hiển Thị (EN / VI) | Đường Dẫn Điều Hướng Giao Diện (Navigator) | Đường Dẫn Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- |
| `F-SYS-01` | Kết Nối Cổng Micro-Gateway MT5 | `MT5 Broker Connection` / `Kết Nối Sàn MT5` | Header ➔ `Công Cụ Khác [•••]` ➔ `Kết Nối Sàn MT5` | `src/components/panels/BrokerConnectionModal.tsx`, `src/store/brokerStore.ts` |
| `F-SYS-02` | Cô Lập Phiên Đa Người Dùng | `Multi-Tenant Isolation` / `Cô Lập Đa Người Dùng` | Tự động phân luồng tại Backend Server | `server/routes/broker.ts` |
| `F-SYS-03` | Đường Truyền Từ Xa Cloudflare Tunnel | `Remote Tunnel Gateway` / `Đường Truyền Từ Xa Cloudflare` | Header ➔ `Công Cụ Khác [•••]` ➔ `Đường Truyền Từ Xa` | `src/components/panels/TunnelModal.tsx`, `src/store/tunnelStore.ts` |
| `F-SYS-04` | Quản Lý Đa Phiên Làm Việc | `Session Manager` / `Quản Lý Phiên Làm Việc` | Header ➔ `Công Cụ Khác [•••]` ➔ `Quản Lý Phiên` | `src/components/panels/SessionManagerModal.tsx` |
| `F-SYS-05` | Bảng Tra Cứu Phím Tắt Nhanh | `Keyboard Shortcuts [?]` / `Phím Tắt Hệ Thống` | Header ➔ `Công Cụ Khác [•••]` ➔ `Phím Tắt` hoặc bấm `?` | `src/components/panels/ShortcutsModal.tsx` |
| `F-SYS-06` | Bộ Khởi Chạy Đa Nền Tảng | `CLI & Launch Scripts` / `Bộ Khởi Chạy Đa Nền Tảng` | Terminal: `npm run dev:all` / `./start_all.sh` / `start_all.bat` | `package.json`, `start_all.sh`, `start_all.bat` |

### Chi Tiết Kỹ Thuật & Tiêu Chí Kiểm Thử (QA Checklist)

#### `F-SYS-01` - Kết Nối Cổng Micro-Gateway MT5
- **Điều hướng:** Header `Công Cụ Khác [•••]` -> `Kết Nối Sàn MT5`.
- **Chức năng:** Kết nối qua cổng micro-gateway FastAPI (Cổng 8765). Điền Server sàn, Số tài khoản MT5, Mật khẩu. Hiển thị độ trễ Ping theo mili-giây.
- **QA Checklist:** Bấm `Kết Nối` -> Huy hiệu chuyển sang màu xanh lá (`ĐÃ KẾT NỐI`) kèm độ trễ ping và đồng bộ số dư tài khoản sàn.

#### `F-SYS-02` - Cô Lập Phiên Đa Người Dùng (Multi-Tenant Isolation)
- **Điều hướng:** Tự động bảo vệ ở tầng backend.
- **Chức năng:** Tách biệt hoàn toàn phiên kết nối và dữ liệu lệnh theo từng `userId`. Lệnh của người dùng A không bao giờ bị rò rỉ sang người dùng B.
- **QA Checklist:** Mở 2 phiên ẩn danh độc lập -> Lệnh ở phiên A không xuất hiện ở phiên B.

#### `F-SYS-03` - Đường Truyền Từ Xa Cloudflare Tunnel Kèm Mã PIN
- **Điều hướng:** Header `Công Cụ Khác [•••]` -> `Đường Truyền Từ Xa`.
- **Chức năng:** Tạo đường dẫn công khai HTTPS Cloudflare để backtest từ xa trên điện thoại di động, được bảo vệ bằng mã PIN 6 chữ số.
- **QA Checklist:** Bật Tunnel -> Dùng điện thoại mở link HTTPS -> Nhập đúng mã PIN -> Giao diện backtest tải mượt mà.

#### `F-SYS-04` - Quản Lý Đa Phiên Làm Việc (Session Manager)
- **Điều hướng:** Header `Công Cụ Khác [•••]` -> `Quản Lý Phiên`.
- **Chức năng:** Tạo phiên mới, Đổi tên, Chuyển đổi qua lại, Sao chép (Clone) hoặc Xóa phiên. Tự động lưu ngầm vào cơ sở dữ liệu SQLite.
- **QA Checklist:** Tạo phiên `Backtest Vàng 2024` -> Chuyển phiên -> Toàn bộ biểu đồ và trạng thái lệnh chuyển đổi chính xác.

#### `F-SYS-05` - Bảng Tra Cứu Phím Tắt Nhanh (Keyboard Shortcuts)
- **Điều hướng:** Bấm phím `?` ở bất kỳ đâu trên giao diện hoặc Header `Công Cụ Khác [•••]` -> `Phím Tắt`.
- **Chức năng:** Bảng tra cứu phím tắt: `Space` (Phát/Dừng), `F8` (Tua từng nến), `B` (Mua), `S` (Bán), `C` (Đóng hết lệnh), `M` (Chỉ báo), `Escape` (Đóng hộp thoại).
- **QA Checklist:** Nhấn `?` -> Bảng phím tắt mở ra. Nhấn `Escape` -> Bảng đóng lại.

#### `F-SYS-06` - Bộ Khởi Chạy Đa Nền Tảng (Cross-Platform Launchers)
- **Điều hướng:** Chạy trong Terminal / Dòng lệnh.
- **Chức năng:**
  - `npm run dev:all`: Chạy đồng thời Backend API và Frontend Vite với màu sắc phân biệt.
  - `start_all.bat`: Khởi chạy 1-click trên Windows.
  - `start_all.sh`: Khởi chạy chuẩn POSIX Bash trên Linux / macOS / WSL kèm cơ chế dọn dẹp tiến trình khi tắt.
- **QA Checklist:** Chạy `npm run dev:all` -> Cả cổng 3001 và cổng 5173 đều hoạt động trơn tru.

---

## 9. Ma Trận Nghiệm Thu Toàn Bộ 48 Tính Năng (Master QA Matrix)

| Mã | Tên Tính Năng | Phân Hệ | Loại Kiểm Thử | Trạng Thái | File Kiểm Thử Tự Động Đối Chiếu |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `F-HDR-01` | Tìm Kiếm Cặp Tiền | Header | UI / Unit | ✅ PASS | `test_comprehensive_suite.ts` |
| `F-HDR-02` | Tổng Hợp Khung Thời Gian | Header | Unit / Math | ✅ PASS | Suite 4: Resampler Tests (6 tests) |
| `F-HDR-03` | Nến Heikin-Ashi | Header | UI / Visual | ✅ PASS | Suite 10: Heikin-Ashi Tests (13 tests) |
| `F-HDR-04` | Chỉ Báo Kỹ Thuật | Header | Math / Realtime | ✅ PASS | Suite 3: Indicators Tests (7 tests) |
| `F-HDR-05` | Spread & Giá Bid/Ask | Header | Math / Order | ✅ PASS | Suite 1: Quant Math Tests (6 tests) |
| `F-HDR-06` | Bảng Quản Lý Vốn | Header | State / Store | ✅ PASS | Suite 2: OMS Tests (22 tests) |
| `F-HDR-07` | Chuyển Đổi Ngôn Ngữ | Header | Locale Parity | ✅ PASS | `npm run check:i18n` (0 lỗi) |
| `F-HDR-08` | Xác Thực Người Dùng | Header | Security / API | ✅ PASS | Suite 2: Security Sanitization |
| `F-CHT-01` | Đồ Thị Canvas 60 FPS | Đồ thị | E2E / Hiệu năng | ✅ PASS | Suite 10: Chart Engine |
| `F-CHT-02` | Kéo Thả SL/TP Trực Quan | Đồ thị | Tương tác / OMS | ✅ PASS | Suite 2: Trailing & SL/TP Tests |
| `F-CHT-03` | Nút (+) Đặt Lệnh Trục Giá | Đồ thị | Tương tác / OMS | ✅ PASS | Suite 12: Order Factory Tests |
| `F-CHT-04` | Menu Chuột Phải Trục Giá | Đồ thị | UI Context | ✅ PASS | Kiểm thử Context Menu |
| `F-CHT-05` | Công Cụ Vẽ Kỹ Thuật | Đồ thị | Canvas State | ✅ PASS | Tọa độ điểm vẽ Fibonacci |
| `F-CHT-06` | Đỉnh/Đáy & Phân Cách Ngày | Đồ thị | Toán học | ✅ PASS | Suite 10: Giới hạn nến |
| `F-CHT-07` | Lá Chắn Quỹ Prop Firm | Đồ thị | Quản trị rủi ro | ✅ PASS | Suite 14: Prop Firm Rule Tests |
| `F-RPL-01` | Điều Khiển Tua Nến 60 FPS | Tua nến | Hiệu năng | ✅ PASS | Suite 2: OMS Tick Stream |
| `F-RPL-02` | Điều Chỉnh Tốc Độ Tua | Tua nến | Thời gian | ✅ PASS | Khoảng thời gian tick nến |
| `F-RPL-03` | Nhảy Nhanh Mốc Dữ Liệu | Tua nến | Tìm kiếm / Index | ✅ PASS | Binary Search Indexing |
| `F-RPL-04` | Tua Nến Theo Ngày Giờ | Tua nến | Tìm kiếm / Math | ✅ PASS | Suite 11: Bar Snapping Tests |
| `F-OMS-01` | Bảng Lệnh Quick Trade | Khớp lệnh | OMS / Thực thi | ✅ PASS | Suite 2: Lệnh thị trường |
| `F-OMS-02` | Hộp Thoại Đặt Lệnh | Khớp lệnh | Factory / Hợp lệ | ✅ PASS | Suite 12: Order Factory Tests |
| `F-OMS-03` | Quản Lý Vị Thế Mở | Khớp lệnh | Vòng đời lệnh | ✅ PASS | Suite 2: Breakeven & Đóng 50% |
| `F-OMS-04` | Quản Lý Lệnh Chờ | Khớp lệnh | Bộ máy khớp lệnh | ✅ PASS | Suite 2: Khớp Limit & Stop |
| `F-OMS-05` | Lịch Sử & Sổ Cái Lệnh | Khớp lệnh | Kế toán định lượng | ✅ PASS | Suite 5: Sổ cái Analytics |
| `F-OMS-06` | Nhật Ký Chiến Lược Bot | Khớp lệnh | Luồng sự kiện | ✅ PASS | Suite 6: Strategy Sandbox |
| `F-OMS-07` | Lịch Kinh Tế Chuẩn Xác | Khớp lệnh | Toàn vẹn dữ liệu | ✅ PASS | Suite 11: Calendar Tests (12 tests) |
| `F-OMS-08` | Bảng Theo Dõi Giá | Khớp lệnh | Đa cặp tiền | ✅ PASS | Suite 1: Thông số cặp tiền |
| `F-OMS-09` | Đóng Hết Lệnh Khẩn Cấp | Khớp lệnh | Đóng hàng loạt | ✅ PASS | Suite 2: Đóng lệnh tức thời |
| `F-DAT-01` | Đọc CSV Số Nguyên | Dữ liệu | Hiệu năng cao | ✅ PASS | Suite 9: CSV Parser Tests |
| `F-DAT-02` | Thư Viện Dataset SQLite | Dữ liệu | CSDL / API | ✅ PASS | Prisma SQLite Persistence |
| `F-DAT-03` | Crawler Thu Thập Online | Dữ liệu | Mạng / API | ✅ PASS | Phân trang REST API |
| `F-DAT-04` | Thu Thập Theo Ngày | Dữ liệu | Mạng / API | ✅ PASS | Nhận diện khoảng trống ngày |
| `F-DAT-05` | Dữ Liệu Mẫu Kaggle | Dữ liệu | Lưu trữ | ✅ PASS | Nạp mẫu dữ liệu chuẩn |
| `F-STR-01` | AI Strategy Transpiler | Thuật toán | LLM Transpiler | ✅ PASS | Suite 6: Biên dịch chiến lược |
| `F-STR-02` | Thẻ Tóm Tắt Quy Tắc | Thuật toán | Phân tích AST | ✅ PASS | Bóc tách thẻ Buy/Sell |
| `F-STR-03` | Sandbox Thực Thi Cách Ly | Thuật toán | Bảo mật OWASP | ✅ PASS | Security Suite: Cách ly Sandbox |
| `F-STR-04` | Kết Nối Đa Mô Hình LLM | Thuật toán | API Connectors | ✅ PASS | Giao thức Fetch & Header |
| `F-STR-05` | Bảng Điều Khiển Bot HUD | Thuật toán | Bảng nổi Live | ✅ PASS | Phát tín hiệu thực thi |
| `F-STR-06` | Bộ Tối Ưu Quét Lưới SL/TP | Thuật toán | Mô phỏng hàng loạt | ✅ PASS | Suite 7: Optimizer Tests (10 tests) |
| `F-STR-07` | Ma Trận Nhiệt Lợi Nhuận | Thuật toán | Trực quan hóa | ✅ PASS | Suite 7: Ma trận nhiệt 2D |
| `F-STR-08` | Kiểm Thử OOS Ngoài Mẫu | Thuật toán | Chống Overfitting | ✅ PASS | Suite 7: Phân chia mẫu OOS |
| `F-STR-09` | Xuất Pine Script v5 | Xuất Bot | Sinh mã nguồn | ✅ PASS | Suite 8: Pine Script Tests |
| `F-STR-10` | Xuất Bot MT5 MQL5 | Xuất Bot | Sinh mã nguồn | ✅ PASS | Suite 8: Biên dịch CTrade |
| `F-STR-11` | Xuất Bot MT4 MQL4 | Xuất Bot | Sinh mã nguồn | ✅ PASS | Suite 8: Tương thích MQL4 |
| `F-STR-12` | Xuất Bot Python CCXT | Xuất Bot | Sinh mã nguồn | ✅ PASS | Suite 8: Thực thi CCXT |
| `F-STR-13` | Xuất Robot cTrader C# | Xuất Bot | Sinh mã nguồn | ✅ PASS | Suite 8: Lớp cBot Schema |
| `F-STR-14` | Xuất Gói Universal JSON | Xuất Bot | Kiểm tra Schema | ✅ PASS | Suite 8: JSON Schema |
| `F-ANL-01` | Chỉ Số Định Lượng Chuẩn | Phân tích | Toán định lượng | ✅ PASS | Suite 5: Analytics KPIs |
| `F-ANL-02` | Mô Phỏng Monte Carlo | Phân tích | Mô hình ngẫu nhiên | ✅ PASS | Suite 5: Mô phỏng 1000 đường |
| `F-ANL-03` | Lịch Lãi Lỗ & Nhiệt Phiên | Phân tích | Tổng hợp dữ liệu | ✅ PASS | Suite 5: Ma trận lịch PnL |
| `F-ANL-04` | Đối Chiếu So Sánh Đa Phiên | Phân tích | So sánh trực diện | ✅ PASS | Đối chiếu nhiều phiên |
| `F-ANL-05` | Xuất CSV & Lưu Ảnh Chụp | Phân tích | File I/O & SQLite | ✅ PASS | Lưu trữ ảnh chụp báo cáo |
| `F-SYS-01` | Micro-Gateway Sàn MT5 | Hạ tầng | Socket / REST API | ✅ PASS | Cầu nối FastAPI Python |
| `F-SYS-02` | Cô Lập Phiên Đa Người Dùng | Hạ tầng | Bảo mật / Phiên | ✅ PASS | Bảo vệ ngữ cảnh User Context |
| `F-SYS-03` | Đường Truyền Cloudflare PIN | Hạ tầng | Mạng / Xác thực | ✅ PASS | Xác thực mã PIN Gateway |
| `F-SYS-04` | Quản Lý Đa Phiên Làm Việc | Hạ tầng | Lưu trạng thái | ✅ PASS | CRUD Phiên & Tự lưu |
| `F-SYS-05` | Bảng Tra Cứu Phím Tắt | Hạ tầng | Khả năng tiếp cận | ✅ PASS | Lắng nghe phím tắt toàn cục |
| `F-SYS-06` | Bộ Khởi Chạy Đa Nền Tảng | Hạ tầng | CLI / Shell | ✅ PASS | `dev:all`, `start_all.sh`, `.bat` |

---

## 10. Hướng Dẫn Bảo Trì & Cập Nhật Tài Liệu

1. **Nguyên Tắc Bất Biến (Drift-Resistance)**: Khi chỉnh sửa hoặc thêm tính năng mới trong thư mục `src/`, lập trình viên bắt buộc cập nhật dòng tương ứng trên cả 2 tài liệu `docs/FEATURE_CATALOG_CHECKLIST.md` và `docs/vi/FEATURE_CATALOG_CHECKLIST.md`.
2. **Nghiệm Thu Tester**: Mọi tính năng trước khi đưa vào bản phát hành phải đạt 100% các tiêu chí kiểm thử nghiệm thu quy định tại tài liệu này.
