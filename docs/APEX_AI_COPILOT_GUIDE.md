# 🧠 Apex AI Copilot - User Guide & Tactical Manual

> **Institutional Smart Money Concepts (SMC) AI Copilot, Real-Time Streaming CoT, and Dynamic Risk:Reward Calibration Engine**  
> *Target Audience: Professional Traders, Quantitative Analysts, Algorithmic Developers*  
> *Language: English (Primary Edition) | [Bản Tiếng Việt](docs/vi/APEX_AI_COPILOT_GUIDE.md)*

---

## 1. Overview & Architectural Philosophy

The **Apex AI Copilot** is a high-performance quantitative co-pilot integrated directly into the QuantBacktest Pro trading canvas. Designed for institutional **Smart Money Concepts (SMC)** trading, it merges:
1. **Dual-Tier AI Routing**: Seamlessly connects to external Large Language Models (OpenAI GPT-4o, DeepSeek, Google Gemini, Anthropic Claude, Ollama Local LLMs, and Cloudflare Reverse Proxies) with automatic, zero-latency failover to the deterministic local **SMC Algorithmic Co-Processor**.
2. **Dynamic Risk-to-Reward (R:R) Calibration**: Uses an advanced Financial Entity & Intent NLP Parser that understands Vietnamese and English natural language trading commands (e.g. `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"`, `"R:R 1:4"`, `"SL 15 pip, TP 60 pip"`), dynamically adjusting price targets to honor your exact risk parameters.
3. **Institutional Guardrails**: Enforces structural trade validation (e.g. no buying in Premium zones, no selling in Discount zones) while strictly calibrating Take Profit targets to match your required expectancy ratio.
4. **Transparent Engine Telemetry**: Displays the currently active inference engine directly on the HUD header, eliminating guesswork about whether insights originate from your configured LLM or the local SMC engine.

---

## 2. Interface Breakdown & Ergonomics

```
+--------------------------------------------------------------+
| [:::] [🧠] Apex AI Copilot (●) [⚡ SMC Algorithm] [⚙] [◀] [▶] [-] [X] |
+--------------------------------------------------------------+
| [✨ Copilot]   [🥞 MTF Matrix]   [⚡ Diagnostics]            |
+--------------------------------------------------------------+
| [CHAIN-OF-THOUGHT STREAMING REASONING ACCORDION]             |
| • Asset: XAUUSD | Timeframe: M5                              |
| • Multi-Timeframe Bias: H4 BULLISH, D1 BULLISH               |
| • Fibonacci Dealing Range: EQUILIBRIUM                       |
| • Target Risk:Reward Calibrated: 1:3.00 (User specified 1:3) |
| • Position Math: Entry 2654.48 | SL: 2652.48 | TP: 2660.48   |
+--------------------------------------------------------------+
| [ACTION PLAN]                                [LONG]          |
| Entry: 2654.48000   |   Stop Loss: 2652.48000 (20 pips)      |
| Take Profit: 2660.48000 (60 pips)                            |
| Risk:Reward: 1 : 3.00 (✨ Calibrated) | Confidence: 85%       |
| [ ✔ Apply Plan ]                                             |
+--------------------------------------------------------------+
| ASK COPILOT              (?) Prompt Guide                    |
| [ Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3      ] |
|                                                              |
| Quick Chips:                                                 |
| [🎯 R:R 1:3] [🎯 R:R 1:2] [🎯 R:R 1:4] [✨ Best Entry?]     |
| [ Send ]  [ Cancel ]              [ ] Auto-Execute (Off)     |
+--------------------------------------------------------------+
```

### Key UI Elements:
- **Engine Badge (`[⚡ SMC Algorithm]` / `[🧠 Model Name]`)**: Located next to the HUD title. Hovering reveals the active provider source and instructions for configuring custom API keys.
- **Embedded Gateway Settings (`[⚙]`)**: Click the gear icon in the HUD header to toggle the Quick LLM Gateway & Provider configuration card directly without leaving the chart canvas.
- **Interactive Prompt Guide (`(?)`)**: Click the guide button adjacent to "Ask Copilot" to reveal prompt engineering templates and supported syntax.
- **Preset R:R Chips**: Click `[🎯 R:R 1:3]`, `[🎯 R:R 1:2]`, or `[🎯 R:R 1:4]` to immediately generate trade setups calibrated to your desired risk-reward ratio without typing.
- **Action Plan Card**: Displays calculated Entry, Stop Loss, Take Profit, calibrated R:R ratio, and institutional checklist verifications (`HTF Bias Aligned`, `Key POI Tap`, `Liquidity Sweep Confirmed`, `LTF CHoCH Confirmed`).

---

## 3. How to Command Copilot: Supported Query Syntax

The Financial Intent & Entity Parser recognizes multi-lingual natural language commands and trading shorthand:

### A. Custom Risk-to-Reward (R:R) Ratios
| User Prompt Example | Extracted R:R | Calculation Impact |
| :--- | :---: | :--- |
| `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"` | **1:3.0** | SL = 20 pips, TP = 60 pips ($60 / 20 = 3.0$) |
| `"R:R 1:4"` or `"target RR 1:4"` | **1:4.0** | SL = 20 pips, TP = 80 pips ($80 / 20 = 4.0$) |
| `"tỉ lệ 1:2.5"` or `"risk reward 1:2.5"` | **1:2.5** | SL = 20 pips, TP = 50 pips ($50 / 20 = 2.5$) |
| `"1:3"` or `"1/3"` | **1:3.0** | Calibrates Take Profit to exact $3 \times$ Risk distance |

### B. Custom Stop Loss & Take Profit in Pips
| User Prompt Example | Extracted Parameters | Calculation Impact |
| :--- | :--- | :--- |
| `"SL 15 pip, TP 60 pip"` | SL = 15 pips, TP = 60 pips | Calibrates R:R to $1:4.00$ ($60 / 15$) |
| `"cắt lỗ 25 pip, tỉ lệ 1:3"` | SL = 25 pips, R:R = 1:3 | TP automatically calculated as $75$ pips ($25 \times 3$) |
| `"chốt lời 45 pip"` | TP = 45 pips | Uses default SL 20 pips, R:R = $1:2.25$ |

### C. Directional Overrides & Strategy Bias
| User Prompt Example | Extracted Bias | Market Confluence Check |
| :--- | :---: | :--- |
| `"Tìm điểm Long"` or `"Buy signal"` | **LONG** | Validates against Discount or Equilibrium dealing range |
| `"Đánh giá Short"` or `"Sell setup"` | **SHORT** | Validates against Premium or Equilibrium dealing range |
| `"Phân tích cấu trúc H4 và D1"` | **MTF** | Audits multi-timeframe swing bias and Order Block mitigation |

---

## 4. Configuring Custom Cloud & Local LLMs

You can switch the inference engine from the default **SMC Algorithmic Co-Processor** to any external LLM provider or custom AI Gateway using two convenient methods:

### Method A: Direct Quick Configuration from HUD Header (Recommended)
1. In the Copilot HUD header, click the **Settings (`⚙`)** icon.
2. The **LLM Gateway & Provider Settings** card drops down directly inside the HUD:
   - **Provider**: Select your target engine (e.g. `Custom Gateway / Reverse Proxy`, `OpenAI`, `Google Gemini`, `DeepSeek`, `Ollama`).
   - **Base URL**: Enter your gateway endpoint (e.g. `https://my-llm-gateway.example.com`, `http://localhost:8000/v1`).
   - **Model**: Enter or choose your desired model name (e.g. `gpt-4o`, `deepseek-chat`, `claude-3-5-sonnet`).
   - **API Key**: Enter your key (click the eye icon to reveal/mask).
3. Click **Kiểm tra kết nối / Test Ping**:
   - Sends a lightweight probe to `/api/copilot/ping` with your credentials.
   - Shows round-trip latency in milliseconds (e.g. `Kết nối thành công (142ms)`) or detailed error diagnostics if the gateway is unreachable.
4. Click **Lưu cấu hình / Save Settings**:
   - Configuration is persisted to local storage and dynamically broadcasted via window events.
   - The HUD header badge immediately reflects your custom model (e.g. `[🧠 gpt-4o]`) without requiring a browser refresh.

### Method B: Via AI Strategy Studio Modal
1. Click **AI Strategy Studio** (`[Trợ lý AI]` or `[AI Strategy]`) in the header or sidebar.
2. Select the **Cài đặt / Settings** tab and configure your keys.
3. Click **Lưu cấu hình / Save Settings**.

### Architecture: Smart URL Auto-Normalization & Dual Delivery
- **Smart URL Normalization**: The backend endpoint normalizer handles any URL format seamlessly:
  - `https://api.openai.com` $\rightarrow$ `https://api.openai.com/v1/chat/completions`
  - `https://custom-gateway.io/v1` $\rightarrow$ `https://custom-gateway.io/v1/chat/completions`
  - `https://custom-gateway.io/v1/chat/completions` $\rightarrow$ correctly preserved without path duplication.
- **Dual Delivery (SSE Stream with Non-Streaming Failover)**:
  1. Copilot first dispatches a streaming request (`stream: true`) to stream tokens in real-time.
  2. If a custom gateway does not support Server-Sent Events (SSE) or returns an HTTP streaming error, Copilot **automatically retries with a standard non-streaming request (`stream: false`)**.
  3. If both requests encounter errors (e.g. 401 Unauthorized, 404 Not Found), Copilot streams an explicit diagnostic warning notice to the trader before gracefully falling back to the local SMC engine.

---

## 5. Mathematical Risk & Expectancy Formulas

In quantitative trading, Risk-to-Reward directly determines mathematical expectancy:

$$\mathbb{E} = (P_{\text{win}} \times \text{R:R}) - (P_{\text{loss}} \times 1)$$

### Price Calibration Equations:
For an asset with current price $P_{\text{entry}}$, pip size $\text{pip}$, requested stop distance $\text{SL}_{\text{pips}}$, and target ratio $R_{\text{target}}$:

- **LONG Position**:
  $$\text{Price}_{\text{SL}} = P_{\text{entry}} - (\text{SL}_{\text{pips}} \times \text{pip})$$
  $$\text{Price}_{\text{TP}} = P_{\text{entry}} + (\text{SL}_{\text{pips}} \times R_{\text{target}} \times \text{pip})$$

- **SHORT Position**:
  $$\text{Price}_{\text{SL}} = P_{\text{entry}} + (\text{SL}_{\text{pips}} \times \text{pip})$$
  $$\text{Price}_{\text{TP}} = P_{\text{entry}} - (\text{SL}_{\text{pips}} \times R_{\text{target}} \times \text{pip})$$

This ensures that whenever you ask for a $1:3$ ratio, the mathematical quotient:
$$\frac{|\text{Price}_{\text{TP}} - P_{\text{entry}}|}{|\text{Price}_{\text{SL}} - P_{\text{entry}}|}$$
is guaranteed to equal exactly **3.00**.

---

## 6. QA Verification Matrix

| Test ID | Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :---: |
| `COPILOT-01` | User asks `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"` | ActionPlan displays `R:R: 1 : 3.00`, TP = Entry $\pm$ (Risk $\times$ 3) | ✅ PASS |
| `COPILOT-02` | User clicks Quick Action Chip `[🎯 R:R 1:3]` | Populates prompt, dispatches stream, returns R:R 1:3 | ✅ PASS |
| `COPILOT-03` | User clicks Prompt Guide button `(?)` | Displays interactive prompt guide popup with R:R, SL/TP tips | ✅ PASS |
| `COPILOT-04` | Engine indicator displays in HUD header | Shows `[⚡ SMC Algorithm]` or `[🧠 gpt-4o]` with explanatory tooltip | ✅ PASS |
| `COPILOT-05` | Zero hardcoded UI strings across 4 locales | `npm run check:i18n` passes with 0 violations | ✅ PASS |
| `COPILOT-06` | External LLM unavailable or offline | Seamlessly falls back to local SMC algorithm with calibrated R:R | ✅ PASS |
| `COPILOT-07` | Click HUD Settings `[⚙]` -> Test Ping & Save | Ping returns latency; saved config updates HUD badge immediately | ✅ PASS |
| `COPILOT-08` | Custom Gateway URL auto-normalization & Dual Delivery | Normalizes `/v1` endpoints and retries non-streaming if SSE unsupported | ✅ PASS |
