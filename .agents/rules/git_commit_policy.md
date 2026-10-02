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

## 3. Remote Push & Pull Request / Merge Request (PR/MR) Standards
- **Scope Completion Requirement (MANDATORY GATE)**:
  - **NEVER push intermediate or unfinished commits to the remote repository**.
  - **NEVER create a Pull Request / Merge Request per commit**: Developing a feature or bugfix often requires multiple local atomic commits (e.g. implementation, test suite expansion, documentation parity). Creating a PR for every incremental commit floods review queues and triggers superfluous CI/CD pipelines.
  - Remote push and Pull Request / Merge Request creation MUST ONLY take place once the **entire request/task scope is 100% completed** and fully verified.
- **Mandatory Pre-Push Quality Gates**:
  Before pushing the branch to `origin`, all 4 project Quality Gates MUST pass with zero errors:
  1. `npx tsc --noEmit` — 0 TypeScript compilation errors.
  2. `npm run check:i18n` — 100% 4-locale parity (`vi`, `en`, `ja`, `zh`) & 0 hardcoded UI strings.
  3. `npm test` — All unit and integration test suites passing.
  4. `npm run build` — Production Vite bundle compiles cleanly.
- **Remote Branch Publication**:
  - Once all criteria and gates pass, publish the dedicated branch to the remote repository:
    ```bash
    git push -u origin <type>/<name>
    ```
  - **Never force push** (`git push --force` or `--force-with-lease`) to `main` or shared branches.
  - **Never push unreviewed code directly to `main`**.
- **Pull Request / Merge Request (PR/MR) Creation**:
  - Immediately following the remote push of the completed dedicated branch, open a Pull Request / Merge Request targeting the base branch (`main`):
    - **In AI Agent sessions**: Use GitHub MCP `create_pull_request` (or platform equivalent).
    - **In CLI sessions**: Use `gh pr create` or the repository web portal.
  - **PR Title**: Follow Conventional Commits format matching the overarching goal (e.g. `feat(replay): add tick-by-tick stepping modal`).
  - **PR Body Standards**:
    - **Summary**: Concise bullet points explaining what was added, modified, or fixed.
    - **Rationale**: Architectural context, tradeoffs, and design decisions.
    - **Quality Gates Verification**: Explicit checklist indicating all checks succeeded:
      - [x] TypeScript clean (`npx tsc --noEmit`)
      - [x] i18n verified across 4 locales (`npm run check:i18n`)
      - [x] Automated test suite passed (`npm test`)
      - [x] Production build clean (`npm run build`)
      - [x] Responsive layout verified (if UI changes made)
    - **Issue Linking**: Reference relevant issues or task descriptions (e.g. `Resolves #123`).

## 4. Git Flow Lifecycle Summary
```text
Step 1: Check clean status       --> git status
Step 2: Create dedicated branch  --> git checkout -b <type>/<name>
Step 3: Implement & refine       --> Atomic Conventional Commits locally
Step 4: Execute Quality Gates    --> tsc, check:i18n, test, build
Step 5: Publish completed branch --> git push -u origin <type>/<name>
Step 6: Open Pull Request (PR)   --> Exactly 1 comprehensive PR per completed task
Step 7: Code Review & Merge      --> Merge into main via GitHub PR / Merge Request
```
