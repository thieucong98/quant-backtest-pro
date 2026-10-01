# 🏆 Giải Đấu Giao Dịch Định Lượng Toàn Cầu: Cẩm Nang Tổ Chức & Thể Lệ Thi Đấu

> **Tập đoàn Công nghệ Tự trị Autonomous Technology Corporation (AUT) — Văn phòng Giám đốc Marketing & Tăng trưởng (CMO)**  
> **Chương trình**: Giải đấu Giao dịch Định lượng Quant Backtest Toàn cầu (Tổ chức Định kỳ Hàng Quý)  
> **Hình thức**: Thi đấu Lập trình Thuật toán & Kiểm chứng Dữ liệu Khách quan trên Mã Nguồn Mở  
> **Đối tượng tham gia**: Quant Developer, Algo Trader, Thí sinh Thi Quỹ, Kỹ sư Toán - Tin  

---

## 1. Ý Tưởng & Cơ Chế Bánh Đà Cộng Đồng (Flywheel)

**Giải đấu Giao dịch Định lượng Toàn cầu (Global Quant Backtest Challenge)** là sự kiện cộng đồng dành riêng cho giới lập trình viên và nhà giao dịch định lượng. Mục tiêu nhằm tạo độ phủ truyền thông tự nhiên, kiểm chứng các mô hình giao dịch trong môi trường công bằng và thúc đẩy trao đổi học thuật trên Discord, Telegram, GitHub và Twitter/X.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BÁNH ĐÀ GIẢI ĐẤU CỘNG ĐỒNG                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [ Tải Nền Tảng Replay 60 FPS Miễn Phí ] ──► [ Tải Bộ Dữ Liệu Thi Đấu ]   │
│                 ▲                                   │                       │
│                 │                                   ▼                       │
│   [ Bảng Vàng Vinh Danh Toàn Cầu ] ◄── [ Kiểm Chứng Mã Băm Hạt Giống Crypt] │
│                 │                                   │                       │
│                 ▼                                   ▼                       │
│   [ Nhận Tài Khoản Quỹ $200.000 ]  ◄── [ Thuyết Trình Thuật Toán Discord ]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Bằng cách cung cấp **bộ dữ liệu lịch sử chuẩn hóa** và yêu cầu thí sinh nộp bài qua **mã băm hạt giống (Seed Hash) có thể tái lập kết quả 100%**, giải đấu loại bỏ hoàn toàn tình trạng chụp màn hình ảo, khoe lãi giả và các bot đánh bạc may rủi.

---

## 2. Cấu Trúc Giải Đấu & Lịch Trình 4 Tuần

| Tuần | Giai Đoạn | Cột Mốc Quan Trọng | Sản Phẩm Bàn Giao |
| :--- | :--- | :--- | :--- |
| **Tuần 1** | **Mở Đăng Ký & Phát Dữ Liệu** | Công bố mã băm tập dữ liệu chuẩn (ví dụ: 5 năm M1 Vàng XAU/USD & Bitcoin). | Thí sinh Fork repo, chạy Docker cục bộ và tham gia kênh Discord `#quant-challenge`. |
| **Tuần 2** | **Sprint 1: Tối Ưu Hóa Tham Số** | Phát triển thuật toán và quét lưới tham số SL/TP. | Nộp bản checkpoint đầu tiên để đồng bộ dữ liệu lên bảng xếp hạng trực tiếp. |
| **Tuần 3** | **Sprint 2: Kiểm Thử Dữ Liệu Ẩn** | Mở khóa tập dữ liệu kiểm thử Out-of-sample bí mật. | Hệ thống CI tự động chạy đối soát thuật toán trên tập dữ liệu chưa từng thấy. |
| **Tuần 4** | **Vòng Chung Kết & Giải Mã Thuật Toán** | Top 10 thí sinh xuất sắc nhất thuyết trình logic trực tiếp trên Discord Stage. | Bình chọn cộng đồng + Hội đồng giám khảo chấm điểm -> Trao giải! |

---

## 3. Công Thức Chấm Điểm Chuẩn Thể Chế

Để ngăn chặn các bot "All-in" đánh bạc lọt vào top đầu, thứ hạng được tính toán dựa trên **Điểm Tổng Hợp Thể Chế (Composite Score)**:

$$\text{Điểm Tổng Hợp} = 0.35 \times \text{Sharpe} + 0.25 \times \text{Sortino} + 0.20 \times \left( \frac{\text{Lợi Nhuận \%}}{\text{Sụt Giảm Max \%}} \right) + 0.10 \times \ln(N_{\text{giao dịch}}) - \text{Điểm Phạt}$$

### Trọng Số & Tiêu Chí Đánh Giá
1. **Tỷ số Sharpe ($S$)** (35%): Đo lường tỷ suất sinh lời trên biến động rủi ro. Mục tiêu $> 1.8$.
2. **Tỷ số Sortino ($S_d$)** (25%): Chỉ phạt biến động giảm (Downside Volatility). Mục tiêu $> 2.5$.
3. **Tỷ lệ Hồi phục Calmar** (20%): Lợi nhuận ròng chia cho mức sụt giảm tối đa. Ưu tiên các bot kiếm lợi nhuận bền vững mà không gây áp lực lên vốn.
4. **Độ Tin Cậy Thống Kê ($\ln(N)$)** (10%): Yêu cầu số lượng mẫu đủ lớn. Các chiến lược dưới 50 giao dịch bị giảm 50% điểm số thành phần này.
5. **Hình Phạt Chống Học Vẹt (Anti-Curve Fitting)**:
   - Sụt giảm tối đa vượt quá **6.0%**: Loại trực tiếp (chuẩn quỹ cấp vốn).
   - Một giao dịch đơn lẻ chiếm $> 35\%$ tổng lợi nhuận: Giảm 25% tổng điểm.
   - Thời gian giữ lệnh trung bình $< 10$ giây: Loại trực tiếp (loại trừ ảo giác trượt giá).

---

## 4. Giao Thức Chống Gian Lận Bằng Mã Băm Hạt Giống (Cryptographic Seed)

QuantBacktest Pro tích hợp sẵn cỗ máy kiểm chứng phiên giao dịch:
- **Tái lập tất định**: Toàn bộ luồng khớp lệnh được gieo mầm bởi một seed ngẫu nhiên thống nhất trên toàn giải đấu.
- **Cây Merkle cho từng lệnh**: Mỗi lệnh khớp (thời gian, giá, khối lượng) được băm vào cây Merkle.
- **Tự động đối soát trên CI Server**: Khi nộp bài qua bot Discord, máy chủ chạy lại chiến lược trên dữ liệu gốc. Nếu đường cong vốn sai lệch dù chỉ 0.01 USD, bài nộp sẽ bị tự động hủy bỏ.

---

## 5. Cơ Cấu Giải Thưởng & Tài Trợ

Tổng quỹ giải thưởng mỗi mùa: **$50.000 USD quy đổi** (Tài khoản Quỹ + Tiền mặt + Gói Bản quyền Pro):
- 🥇 **Giải Nhất**: Tài khoản Quỹ **$200.000 USD** (được tài trợ bởi Quỹ Đối tác), 3.000 USD tiền mặt và bản quyền Thể chế trọn đời.
- 🥈 **Giải Nhì**: Tài khoản Quỹ **$100.000 USD**, 1.500 USD tiền mặt và 2 năm bản quyền Pro.
- 🥉 **Giải Ba**: Tài khoản Quỹ **$50.000 USD**, 500 USD tiền mặt và 1 năm bản quyền Pro.
- 🎖️ **Top 10 Chung Cuộc**: Voucher thi quỹ $10.000 USD miễn phí và huy hiệu vinh danh trên Discord.

---

## 6. Tích Hợp Bot Discord & Telegram
- Lệnh `/challenge register`: Cấp mã thí sinh và bộ hạt giống bảo mật.
- Lệnh `/challenge submit <proof.json>`: Nộp tệp chứng chỉ, tự động tính điểm và cập nhật bảng vàng.
- Lệnh `/challenge leaderboard`: Xem Top 20 thí sinh theo thời gian thực.
- Kênh `#strategy-showcase`: Diễn đàn mổ xẻ mã nguồn mở sau khi kết thúc giải đấu.

---
