SmartSpend — Foundation Document

Upload this file FIRST, before any phase file. It gives the agent the overall context it needs for every phase.

Vision

An AI-powered personal finance app that goes beyond basic expense logging: expense tracking, group expense splitting, AI-driven budget coaching, and investment portfolio tracking, in one product.

Build approach: This is being built in 6 sequential phases, each in its own file, fed to the coding agent one at a time — only after the previous phase is built and tested. Do not attempt to build features from later phases while working on the current phase. If something in the current phase would benefit from an architectural decision that affects a future phase, flag it, but keep scope strictly to the current phase's file.

Platform: Web app first (responsive site). Mobile app (Play Store/App Store) comes later, once the web product is validated — not part of the current build.

Tech Stack


Frontend: React + Tailwind. Keep business logic in shared hooks/services rather than DOM-specific code, so a future mobile port isn't a full rewrite.
Backend: Node.js/Express or Python/FastAPI
Database: PostgreSQL (relational data — users, transactions, splits) + Redis (caching)
Data analysis: Python (Pandas, NumPy) for statistical forecasting — no LLM calls for arithmetic, only for turning computed numbers into natural-language explanations
AI/LLM: Google Gemini API (free tier — Flash models) for the AI insights/recommendation features in Phase 3+
Market/investment data: mfapi.in (free, AMFI-backed) for mutual fund NAVs — finalized. Stock price data source is not yet decided: an NSE/Yahoo-based free wrapper was considered but needs more research before committing, given the reliability concerns of unofficial real-time data sources. Treat stock price integration as pending — do not build against a specific stock API until this is finalized.
Calendar integration: Google Calendar API / device calendar APIs
Notifications: Firebase Cloud Messaging (push) + a scheduler (cron/Celery) for monthly summaries


Data Model (grows across phases — this is the full picture; each phase file notes which tables it needs)


users (id, name, email, password_hash, created_at)
expenses (id, user_id, amount, category_id, date, note, payment_method, group_id nullable)
categories (id, user_id nullable [null = default/global], name, icon)
budgets (id, user_id, category_id nullable [null = overall], amount, period, start_date)
groups (id, name, created_by)
group_members (group_id, user_id)
group_expenses (id, group_id, paid_by_user_id, amount, description, date)
group_expense_splits (group_expense_id, user_id, amount_owed)
investments (id, user_id, type [stock/mutual_fund/fd], symbol/name, quantity, purchase_price, purchase_date)
bills (id, user_id, name, amount, due_date, recurrence)


Non-Functional Requirements (apply to every phase)


Third-party data sources & dependency hygiene: Prefer calling free data APIs via direct HTTPS requests over installing community npm wrapper packages. If a wrapper library is necessary, check its GitHub activity (recent commits, issue count, stars) and skim the source before installing. Run npm audit regularly, keep dependencies updated, never commit API keys/secrets — use .env + .gitignore from the first commit.
Data privacy: financial data is sensitive — encrypt at rest, use HTTPS everywhere, never log raw transaction data in plaintext logs.
Calendar/financial data access: explicit opt-in permissions, clearly explain what's read and why (Phase 4).
Performance: dashboard/chart queries should be pre-aggregated (don't recompute totals from raw transactions on every page load — maintain rolling summary tables).
Offline support: not required for web MVP; revisit when porting to mobile.


Out of Scope (not being built in any current phase)


Native mobile app — web only for now
Auto-synced investment holdings from broker/demat accounts — manual entry only
Real payment processing / settling balances via actual money transfer
Bank account linking (Plaid-style aggregation)
Multi-currency support
Automated bank SMS/email parsing