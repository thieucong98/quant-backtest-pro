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

## 2. Professional Git Flow & Branching Standards (MANDATORY)
- **MANDATORY NEW BRANCH CHECKOUT BEFORE IMPLEMENTATION**:
  - NEVER implement new features, non-trivial enhancements, or bugfixes directly on `main`.
  - ALWAYS create and switch to a dedicated branch before making code changes:
    - `feature/<short-name>`: for new features or user-facing capabilities (e.g. `feature/trailing-sl`, `feature/monte-carlo-export`).
    - `fix/<short-name>`: for bug fixes or corrections (e.g. `fix/calendar-timezone`, `fix/tunnel-cors`).
    - `refactor/<short-name>`: for architecture or design pattern refactoring (e.g. `refactor/oms-slice`, `refactor/store-modularization`).
    - `perf/<short-name>`: for performance optimizations (e.g. `perf/chart-canvas-render`, `perf/resampling-cache`).
    - `test/<short-name>`: for adding or updating test suites.
    - `docs/<short-name>`: for standalone documentation updates.
- **Professional Git Flow Lifecycle**:
  - Step 1: Ensure base branch is clean (`git status`).
  - Step 2: Create & checkout dedicated branch: `git checkout -b <type>/<name>`.
  - Step 3: Implement changes and verify all Quality Gates (`npx tsc --noEmit`, `npm run check:i18n`, `npm test`, `npm run build`).
  - Step 4: Commit atomically with Conventional Commits format (`feat(...)`, `fix(...)`, `refactor(...)`, etc.).
  - Step 5: Push dedicated branch to remote origin (`git push -u origin <type>/<name>`).
  - Step 6: Create Pull Request / Merge Request targeting base branch (`main`).
- **End-of-Task Delivery & PR Requirement (NO PREMATURE PRs)**:
  - Do NOT push or create a Pull Request for every individual commit or intermediate step.
  - ONLY push the branch and open a Pull Request when the ENTIRE user request/feature scope is 100% completed and all Quality Gates pass (`tsc`, `check:i18n`, `test`, `build`).
  - Never push unverified code or broken commits to origin. Never force-push (`--force`) to shared branches.

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

---

## 5. Open-Source Documentation & Localized Showcase Standards
- **English-First Root Docs**: `README.md` and all primary architectural docs must be authored in clear, professional English.
- **Visual Asset Language Parity**: UI screenshots in `README.md` must display English interface labels (`docs/assets/en/`). Localized readmes like `README.vi.md` must display matching localized interface labels (`docs/assets/vi/`).
- **Parity Across Translations**: Any updates to feature sets, test counts, or commands in `README.md` must be mirrored in `README.vi.md`.

---

## 6. Mandatory Feature Catalog & Checklist Parity (CRITICAL)
- **ZERO UNTRACKED CAPABILITIES**: Every new user-facing capability, architectural module, or analytical engine MUST be indexed and documented in BOTH:
  - `docs/FEATURE_CATALOG_CHECKLIST.md` (English primary edition)
  - `docs/vi/FEATURE_CATALOG_CHECKLIST.md` (Vietnamese localized edition)
- **TEST CRITERIA & NAVIGATION MANDATE**: Each catalog entry must define the Module ID, Technical Name, Display Name (EN/VI), UI Navigation Path, Source Code Path, and QA Acceptance Checklist criteria with step-by-step verification flows.
- **SYNCHRONIZED TOTALS**: Whenever new features are introduced, update the summary tables, navigation indices, and total feature counts across all localized checklists and README documentation.

