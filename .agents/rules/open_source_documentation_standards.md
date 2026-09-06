# Open-Source Documentation & Asset Localization Standards (MANDATORY)

To uphold the quality and global accessibility of **QuantBacktest Pro** as a premier open-source repository, all contributors and AI agents must strictly adhere to these documentation and asset standards.

---

## 1. Primary Documentation Language (English First)
- **Root Documentation Must Be in English**:
  - All default root documentation files (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `AGENTS.md`, and `ROADMAP.md`) MUST be authored in clear, professional English.
  - English is the universal lingua franca for open-source contributors, maintainers, and automated code analysis agents worldwide.

## 2. Localized Documentation Conventions
- **Language Suffix Naming**:
  - Non-English translations of documentation files must carry an explicit ISO 639-1 language code suffix:
    - Vietnamese: `README.vi.md`, `CONTRIBUTING.vi.md`
    - Japanese: `README.ja.md`
    - Chinese: `README.zh.md`
- **Synchronous Content Parity**:
  - Whenever technical capabilities, badges, test counts, or CLI commands are updated in `README.md`, they must be immediately reflected in all localized editions.

## 3. UI Language Parity in Visual Showcase Assets (CRITICAL)
- **Zero Language Discrepancy in Screenshots**:
  - Screenshots embedded in English documentation (`README.md`) MUST display the English application user interface.
  - Screenshots embedded in localized documentation (`README.vi.md`) MUST display the matching localized user interface (e.g., Vietnamese labels).
- **Directory Structure for Showcase Assets**:
  - `docs/assets/en/`: Contains all full-resolution UI screenshots captured while the application language is set to English (`quant_lang: en`).
  - `docs/assets/vi/`: Contains all full-resolution UI screenshots captured while the application language is set to Vietnamese (`quant_lang: vi`).
  - `docs/assets/`: Root fallback directory populated with English assets for external markdown readers and package registries.

## 4. Agent Rule Files Language
- All rule and guideline files located inside `.agents/rules/` and `AGENTS.md` MUST be written in English to ensure consistent parsing by international AI models and developer teams.
