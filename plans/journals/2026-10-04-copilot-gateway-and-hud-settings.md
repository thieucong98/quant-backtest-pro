# 📓 Technical Journal: Apex AI Copilot Gateway Integration & In-HUD Settings

- **Date**: 2026-10-04
- **Branch**: `fix/copilot-gateway-url-and-settings-hud`
- **Pull Request**: [#17](https://github.com/thieucong98/quant-backtest-pro/pull/17)
- **Author**: Antigravity AI Pair Programmer

---

## 1. Problem Statement & Root Cause Diagnosis
When the user configured a custom LLM Gateway / Reverse Proxy, questions submitted in the **Apex AI Copilot HUD** did not hit the custom gateway and seemed to silently fall back to the deterministic local SMC engine.

### Root Causes
1. **Frontend Port Migration & Origin Storage Isolation**:
   - Migration from port 5173 to port 3111 meant `localStorage` on `http://127.0.0.1:3111` had no stored `quant_llm_config`.
   - Without an API key or custom provider configured on port 3111, the frontend sent `{}` for `llmConfig`, causing the backend to immediately fall back to the local SMC Algorithmic Co-Processor without dispatching outbound HTTP calls.
2. **URL Duplication in Endpoint Normalization**:
   - The backend previously appended `/chat/completions` directly without checking whether the user-supplied Base URL already included `/v1` or `/chat/completions`.
   - Entering `https://gateway.example.com/v1/chat/completions` resulted in `.../v1/chat/completions/chat/completions` (404 error).
3. **Mandatory SSE Streaming Incompatibility**:
   - Some reverse proxies and custom gateways do not support Server-Sent Events (`stream: true`) or return 400/422/500 on streaming requests.
4. **Silent Error Failover Without User Diagnostics**:
   - Network errors or upstream HTTP exceptions previously caught silently and fell back to local SMC without notifying the trader.

---

## 2. Solutions Implemented

1. **In-HUD Gateway & Model Settings Card (`src/components/chart/AICopilotHUD.tsx`)**:
   - Added a `Settings2` (`⚙️`) button in the HUD header.
   - Embedded configuration panel for:
     - AI Provider (`OpenAI`, `Google Gemini`, `DeepSeek`, `Ollama`, `Custom Gateway / Reverse Proxy`)
     - Base URL
     - Model Name
     - API Key with show/mask toggle
     - Live **Test Ping** button with latency measurement (ms) and error message feedback
     - **Save Settings** button with instant state propagation via `quant_llm_config_changed` window event.
2. **Smart Endpoint Auto-Normalization (`server/routes/copilot.ts`, `src/api/copilot.ts`)**:
   - Auto-normalizes plain hostnames (`http://host` -> `http://host/v1/chat/completions`), `/v1` hosts (`http://host/v1` -> `http://host/v1/chat/completions`), and avoids duplicate paths.
3. **Dual Delivery Resilience (`server/routes/copilot.ts`)**:
   - Dispatches SSE streaming (`stream: true`). If rejected or unsupported, automatically retries via standard Non-Streaming request (`stream: false`).
   - If both fail, streams a user-facing diagnostic notice prior to local SMC fallback.
4. **Gateway Connectivity Ping Route (`server/routes/copilot.ts`)**:
   - Added `POST /api/copilot/ping` endpoint to measure latency and test authorization before saving.
5. **100% Internationalization Parity (4 Locales)**:
   - Added 12 translation keys in `src/i18n/types.ts` and all 4 locales (`vi.ts`, `en.ts`, `ja.ts`, `zh.ts`).
   - `npm run check:i18n` verified with 0 hardcoded strings.
6. **Documentation Parity**:
   - Updated `docs/APEX_AI_COPILOT_GUIDE.md` and `docs/vi/APEX_AI_COPILOT_GUIDE.md`.
   - Updated `docs/FEATURE_CATALOG_CHECKLIST.md` and `docs/vi/FEATURE_CATALOG_CHECKLIST.md` under `F-SMC-07`.

---

## 3. Verification & Quality Gates
- `npm run check:i18n`: 0 violations
- `npx tsc --noEmit` (client & server): 0 errors
- `npm test`: 237/237 tests passed (including Suite 24 Gateway Normalizer & Route tests)
- `npm run build`: Production bundle built cleanly in ~9.96s
- Live Puppeteer test executed and verified in browser on `http://127.0.0.1:3111/`.
