---
trigger: always_on
---

Project Rules — SmartSpend

Phase discipline


This project is built in 6 sequential phases, each described in its own file (01-phase1... through 06-phase6...).
Only build what is listed in the phase file explicitly attached to the current task. Do not implement features described in other phase files, even if they seem related or easy to add while you're already in that part of the code.
If you notice that a decision now would make a later phase easier or harder, say so in your response — but do not act on it unless the current phase file asks for it.
Before starting a build, confirm which phase you're on and briefly restate its scope back before writing code.


Tech stack (do not deviate without asking)


Frontend: React + Tailwind
Backend: Node.js/Express or Python/FastAPI (pick one and stay consistent across phases)
Database: PostgreSQL + Redis for caching
AI/LLM calls: Google Gemini API (free tier, Flash models) only — do not add a different LLM provider without explicit approval
Market data: mfapi.in for mutual fund NAVs (stock price data is not part of the current scope — mutual funds only for now)


Dependency & security hygiene


Before running npm install or pip install for any new package, list the package name and a one-line reason first.
Prefer calling free public APIs via direct HTTPS requests (fetch/axios/requests) over installing a third-party wrapper library, when a direct call is reasonably simple.
If a wrapper library is genuinely necessary, check that it has recent commits and reasonable community usage before installing — flag it to me if it looks unmaintained or has very few stars.
Never commit API keys, tokens, or secrets to the repository. All secrets go in .env, and .env must be in .gitignore from the first commit.
Run npm audit (or the Python equivalent) after adding new dependencies and report any high/critical findings.


Data handling


All financial data (expenses, budgets, investment holdings) is sensitive — never log raw transaction data in plaintext logs.
Use HTTPS for all external calls.
For AI/LLM calls: compute all numbers (totals, forecasts, budget math) in code first. Only send already-computed figures to the LLM for natural-language phrasing — never ask the LLM to do the arithmetic itself.


Code quality expectations


Keep business logic in shared services/hooks rather than tightly coupled to UI components, since this project moves from web to mobile later.
Every new feature should include basic tests before being marked complete.
After finishing a phase's features, summarize what was built and flag anything that deviated from the phase file.


Communication style


Keep explanations direct and concise. Skip long preambles — get to the plan or the code.
If a requirement in the phase file is ambiguous, make a reasonable assumption, state it in one line, and proceed rather than stopping to ask.