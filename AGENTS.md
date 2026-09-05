# QuantBacktest Pro - Agent Guidelines & Mandatory Project Rules

Welcome to **QuantBacktest Pro** codebase. All AI coding agents, assistants, and human contributors MUST strictly adhere to the following project-wide rules and guidelines.

---

## 1. MANDATORY Internationalization (i18n) Standards (CRITICAL)
- **ZERO HARDCODED UI STRINGS**: Never write raw Vietnamese or English strings directly in JSX/TSX.
- **100% LOCALE PARITY**: Whenever adding a key in `src/i18n/types.ts`, it MUST be populated in ALL 4 locales:
  - `src/i18n/locales/vi.ts` (Vietnamese)
  - `src/i18n/locales/en.ts` (English)
  - `src/i18n/locales/ja.ts` (Japanese)
  - `src/i18n/locales/zh.ts` (Chinese)
- **NO STRING FALLBACKS**: Never write `t.key || 'Default Text'`. All options, buttons, conditional text (`BẬT/TẮT`, `ON/OFF`) must have explicit translation keys.
- **AUTOMATED CHECK**: Run `npm run check:i18n` or `npx tsx scripts/check-i18n.ts` before every commit. Zero errors allowed.

---

## 2. Git Commit Policy
- **Local Commits Only**: Always create a clean, descriptive local git commit after completing work.
- **NEVER RUN `git push`**: Do not push to remote origin unless explicitly instructed by the user.

---

## 3. Responsive & UI/UX Standards
- The application MUST be 100% responsive across:
  - Desktop (1920x1080)
  - Laptop (1366x768 & 1280x800)
  - Tablet (1024x768 & 768x1024)
  - Mobile (375x812)
- Zero horizontal overflow or cut-off. Use tiered progressive collapse and the More Tools `[•••]` dropdown or mobile drawer.

---

## 4. Quality & Build Validation
- Always run `npx tsc --noEmit` and `npm run build` before considering any task complete.
