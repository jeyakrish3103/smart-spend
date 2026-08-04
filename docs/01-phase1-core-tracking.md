SmartSpend — Phase 1: Core Expense Tracking (MVP)

Context: This is Phase 1 of a 6-phase build. The Foundation document (00-foundation.md) has already been provided with the overall tech stack and vision — refer to it for context. Build ONLY what's listed below. Do not add group-splitting, AI features, calendar sync, or investment tracking yet — those come in later phases.

Goal

A user can log expenses daily, see where their money goes, and set/track a budget. This should be a complete, usable product on its own — the foundation everything else builds on.

Features to build


User auth: signup/login, JWT-based sessions
Manual expense entry: amount, category, date, note, payment method
Categories: default categories (Food, Travel, Shopping, Gym, Bills, etc.) plus user-created custom categories
Expense list view: with filters by date range and category
Dashboard: total spend this week / this month
Category breakdown chart: pie chart of spend by category
Spend-over-time chart: line/bar chart, viewable by week / month / quarter
Budgets: user can set a spending limit per category or overall, for a chosen time period (weekly / monthly / custom range)
Budget alerts: visual indicator or notification when nearing or exceeding a set limit
Data export: CSV export of expenses


Relevant data model tables (from Foundation doc)

users, expenses, categories, budgets

Definition of done


User can register, log in, and log an expense in under 30 seconds
Dashboard accurately reflects totals and category breakdowns for the logged-in user
Budget limits trigger a visible warning when exceeded
CSV export produces a correctly formatted file of the user's expense history