---
trigger: manual
---

# Professional Git Flow & Branching Standards (MANDATORY)

## 1. Mandatory New Branch Checkout Before Implementation
- **NEVER implement new features, non-trivial enhancements, or bugfixes directly on `main`**.
- Before writing code for any task, feature, or bugfix, the AI Agent MUST:
  1. Inspect Git status: `git status` (ensure the base working tree is clean).
  2. Create and switch to a dedicated branch following Git Flow naming conventions:
     - `feature/<feature-name>`: New capabilities, algorithms, or UI enhancements.
     - `fix/<bug-name>`: Bug fixes, calculation corrections, or security patches.
     - `refactor/<module-name>`: Architectural improvements, modularization, or slice extraction.
     - `perf/<optimization-name>`: Performance optimizations (rendering, calculation, caching).
     - `test/<test-suite>`: Unit, integration, or end-to-end test suites.
     - `docs/<doc-name>`: Documentation and rule updates.

## 2. Local Commits & Conventional Commits Standards
- After implementation is complete and all Quality Gates pass (`npx tsc --noEmit`, `npm run check:i18n`, `npm test`, `npm run build`), create clean, atomic local commits adhering to **Conventional Commits**:
  - `feat(...)`: A new feature or capability.
  - `fix(...)`: A bug fix or correction.
  - `refactor(...)`: Code refactoring without changing observable behavior.
  - `docs(...)`: Documentation or rule updates.
  - `test(...)`: Adding or updating test cases.
  - `perf(...)`: Performance optimization.

## 3. Strict Remote Push Policy
- **NEVER RUN `git push`** to origin or any remote repository unless the user explicitly provides an unmistakable command (e.g. "push code", "git push", "push to github").
- All automated tasks and agent workflows must stop at the local commit step.
