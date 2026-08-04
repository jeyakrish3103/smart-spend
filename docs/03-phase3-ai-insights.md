SmartSpend — Phase 3: AI Insights & Forecasting

Context: This is Phase 3 of a 6-phase build, built on top of Phase 1 (core tracking) and Phase 2 (group expenses), already built and tested. Refer to the Foundation document (00-foundation.md) for overall tech stack. Build ONLY what's listed below — no calendar sync or investment tracking yet.

Goal

Turn the user's historical expense data into plain-language insights, forecasts, and recommendations — using deterministic math for calculations and an LLM only to explain results in natural language.

Important implementation principle

Do not call the LLM for arithmetic (totals, averages, forecasts, budget math). Compute all numbers with plain code (Python/Pandas/NumPy or equivalent). Use the LLM (Gemini API, free tier — see Foundation doc) only to turn already-computed numbers into a natural-language summary or recommendation. This keeps results accurate and keeps API costs near zero.

Features to build


Weekly/monthly/quarterly AI-generated summary: a plain-language recap of spending for the period (e.g., "You spent 20% more on food this month, mostly on weekends") — computed stats fed to the LLM for phrasing
Spend forecasting: given the user's current spending pace this period, project whether they'll stay within budget before their next paycheck/period end. Use a simple daily-average-burn-rate calculation, not a complex model
Budget recommendation engine:

User inputs their priorities (e.g., "rent and groceries are non-negotiable, dining out and shopping are flexible") and a savings goal
System analyzes historical spend per category
System suggests concrete cut targets per category to hit the stated savings goal, respecting stated priorities (don't suggest cutting non-negotiable categories)



Impulse purchase calculator: user inputs a potential purchase (amount + category); system checks it against remaining budget, current spending pace, and stated priorities, and returns a real-time verdict with reasoning (e.g., "This would put you 15% over your shopping budget with 12 days left this month") — not just a yes/no
Month-end savings notification: compares this month's spend/savings to last month, expressed as a percentage change, delivered as a notification


Relevant data model tables

Reads from expenses, budgets, categories (Phase 1). No new tables required unless you want to persist generated summaries — optional ai_insights table (id, user_id, period, summary_text, generated_at) if you want history of past summaries.

Definition of done


Weekly/monthly summaries are generated correctly and read naturally, grounded in accurate computed numbers
Forecast correctly flags when a user is on pace to exceed budget before period end
Budget recommendations respect stated priorities and add up to the stated savings goal
Impulse purchase calculator gives a reasoned verdict, not a bare yes/no
LLM is only used for phrasing/explanation, never for the underlying math