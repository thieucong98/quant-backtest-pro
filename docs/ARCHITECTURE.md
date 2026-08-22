# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE SPECIFICATION)
## NỀN TẢNG QUANT BACKTEST PRO

Tài liệu này mô tả sơ đồ kiến trúc tổng thể, luồng dữ liệu thời gian thực (Data Flow) và máy trạng thái (State Machine) của hệ thống **Quant Backtest Pro**.

---

## 1. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ (HIGH-LEVEL ARCHITECTURE)

```mermaid
graph TB
    subgraph UI_LAYER["Giao Diện Người Dùng (UI Layer)"]
        Header["Header Component (Symbol, TF, Auth, i18n)"]
        Chart["TradingView Lightweight Chart v4.x"]
        CanvasOverlay["Transparent HTML5 Canvas (Drawing Tools)"]
        ReplayBar["Replay Timeline & Speed Bar"]
        PositionsTable["Bottom Dock: Positions & Orders Table"]
        Modals["Modals: OrderEntry, AIStudio, Analytics, Data, Shortcuts, Auth"]
    end

    subgraph STATE_LAYER["Tầng Quản Lý Trạng Thái (Zustand Central Store)"]
        BacktestStore["useBacktestStore (Candles, Index, OMS State, Drawings, i18n)"]
        AuthStore["useAuthStore (User Session, Profile, SSO OAuth State)"]
    end

    subgraph ENGINE_LAYER["Động Cơ Tính Toán & Khớp Lệnh (Quant Core Engines)"]
        MatchingEngine["OrderMatchingEngine (Market, Limit, Stop, SL/TP, Trailing, Stop Out)"]
        QuantMath["MultiAssetMathEngine (Pip Value, Margin, PnL, Commission, Swap)"]
        Resampler["TimeframeResampler (M1 -> M5, M15, M30, H1, H4, D1)"]
        IndicatorEngine["IndicatorCalculator (SMA, EMA, RSI, MACD, BB, ATR)"]
        AISandbox["StrategyRunner (Isolated JS Sandbox & Copilot Generator)"]
        AnalyticsEngine["AnalyticsEngine (Sharpe, Drawdown, Monte Carlo 1000x, Heatmap)"]
    end

    subgraph PERSISTENCE_LAYER["Tầng Lưu Trữ Cục Bộ (Persistence Layer)"]
        DexieDB["Dexie.js IndexedDB (Candles, Sessions, Strategies)"]
        LocalStorage["LocalStorage (Auth Session & Language Preference)"]
    end

    UI_LAYER --> STATE_LAYER
    STATE_LAYER --> ENGINE_LAYER
    ENGINE_LAYER --> PERSISTENCE_LAYER
```

---

## 2. LUỒNG DỮ LIỆU VÒNG LẶP REPLAY (REPLAY DATA FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Trader as Người Dùng / Timer
    participant ReplayBar as Replay Controller
    participant Store as Zustand Store
    participant Engine as OrderMatchingEngine
    participant AI as StrategyRunner
    participant Chart as TradingView Chart
    participant Analytics as Analytics Engine

    Trader->>ReplayBar: Bấm Play hoặc Step +1 (Phím F)
    ReplayBar->>Store: Gọi hàm stepForward()
    Store->>Store: currentIndex = currentIndex + 1
    Store->>Engine: processCandle(currentCandle)
    
    alt Có lệnh chờ (Pending) hoặc Vị thế mở (Open Positions)
        Engine->>Engine: Khớp lệnh Limit/Stop & Cập nhật Trailing Stop
        Engine->>Engine: Kiểm tra SL / TP & Kiểm tra Ngưỡng Stop Out (<50%)
    end

    opt Nếu Tự Động Giao Dịch AI = ON
        Store->>AI: onCandle(candle, indicators, account, api)
        AI-->>Engine: Bắn lệnh BUY / SELL tự động
    end

    Engine-->>Store: Cập nhật AccountState, OpenPositions, ClosedPositions
    Store->>Chart: Cập nhật nến mới, Volume, Markers & Entry/SL/TP lines
    Store->>Analytics: Cập nhật điểm Equity Curve mới
```

---

## 3. MÁY TRẠNG THÁI KHỚP LỆNH (ORDER LIFECYCLE STATE MACHINE)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Đặt lệnh Limit / Stop
    [*] --> OPEN : Đặt lệnh Market (Khớp ngay tại Bid/Ask)

    PENDING --> OPEN : Giá thị trường chạm Trigger Price
    PENDING --> CANCELLED : Người dùng hủy lệnh

    OPEN --> OPEN : Dời SL về Hòa Vốn (Set BE)
    OPEN --> OPEN : Cập nhật Trailing Stop theo đỉnh/đáy nến
    OPEN --> OPEN : Cắt 50% khối lượng (Partial Close)

    OPEN --> CLOSED_TP : Giá chạm Take Profit
    OPEN --> CLOSED_SL : Giá chạm Stop Loss
    OPEN --> CLOSED_MANUAL : Người dùng đóng lệnh thủ công
    OPEN --> CLOSED_STOPOUT : Ký quỹ sụt giảm Margin Level < 50%

    CLOSED_TP --> [*]
    CLOSED_SL --> [*]
    CLOSED_MANUAL --> [*]
    CLOSED_STOPOUT --> [*]
    CANCELLED --> [*]
```

---

## 4. TỐI ƯU HÓA HIỆU NĂNG RENDER (RENDER PERFORMANCE)

Để duy trì tốc độ **60 FPS** khi tua nến ở tốc độ tối đa **100x (100 nến/giây)**:
1. **Decoupled Canvas Rendering**: Lớp vẽ kỹ thuật (DrawingCanvas) lắng nghe sự kiện tọa độ của Lightweight Charts độc lập, không kích hoạt re-render toàn bộ trang React.
2. **Selective State Subscriptions**: Các component chỉ subscribe đúng slice state cần thiết thông qua Zustand selector.
3. **Incremental Memory Management**: Array nến chỉ cắt lát slice theo `currentIndex + 1` để giảm thiểu chi phí bộ nhớ.
