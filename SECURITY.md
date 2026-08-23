# Security Policy

## Supported Versions

We actively provide security patches and updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability within **Quant Backtest Pro**, please follow responsible disclosure practices:

1. **DO NOT** create a public GitHub Issue.
2. Email details to the security team or maintainers at: `security@quantbacktest.pro` (or open a private security advisory on GitHub).
3. Include:
   - Description of the vulnerability.
   - Steps to reproduce or proof-of-concept script.
   - Potential impact.

We will acknowledge receipt within 48 hours and work with you on a timely remediation before any public announcement.

---

## Sensitive Information Notice

- **Quant Backtest Pro** runs client-side simulation directly in your browser and stores sessions/strategies in your local SQLite database (`server/backtest.db`).
- All LLM API keys and proxy URLs are stored strictly in your browser's `localStorage` and are never transmitted to external analytics servers.
