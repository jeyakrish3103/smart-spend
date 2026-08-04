SmartSpend — Phase 2: Group Expenses (Splitwise-style)

Context: This is Phase 2 of a 6-phase build, built on top of Phase 1 (core expense tracking, already built and tested). Refer to the Foundation document (00-foundation.md) for overall tech stack. Build ONLY what's listed below — no AI features, calendar sync, or investment tracking yet.

Goal

Users can create groups (trips, roommates, events), log shared expenses, split them among members, and track who owes whom.

Features to build


Create a group: name, add members (existing users of the app)
Add a group expense: any member logs an expense with an amount and description, and specifies who it's split between
Split methods: equal split, custom amounts, or percentage-based split
Balance view: running balance per member showing who owes whom, with a simplified net settlement (e.g., minimize the number of transactions needed to settle up)
Settle-up flow: mark a debt as paid (no real payment processing — this is just a record-keeping action)
Notifications: notify group members when someone adds a new expense to a group they're in


Relevant data model tables (from Foundation doc)

groups, group_members, group_expenses, group_expense_splits — plus existing users table from Phase 1

Definition of done


A user can create a group, add members, and log a shared expense with any of the three split methods
Balance view correctly shows net amounts owed between all group members
Settling up correctly updates the balance view
Group members receive a notification when a new group expense is added

Content