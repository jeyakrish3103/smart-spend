# SmartSpend — Phase 4: Calendar Integration

**Context:** This is Phase 4 of a 6-phase build, built on top of Phases 1-3 (core tracking, group expenses, AI insights), already built and tested. Refer to the Foundation document (00-foundation.md) for overall tech stack. Build ONLY what's listed below — no investment tracking yet.

## Goal
Reduce manual entry friction by letting the app suggest expense entries based on calendar events, with the user always confirming before anything is logged.

## Features to build

1. **Calendar connection**: connect Google Calendar (or device calendar) with read-only access, explicit opt-in, clear explanation of what's being read
2. **Event detection**: identify calendar events with likely financial signals (e.g., "Dinner with Alex," "Team lunch," "Concert")
3. **Suggested expense prompt**: when such an event is detected, prompt the user to log an expense against it, pre-filled with event title, date, and attendees where available (amount and category still require user input/confirmation)
4. **User confirmation required**: never create an expense record automatically from calendar data without explicit user confirmation — this is assistive, not automatic

## Relevant data model tables
Reads from `expenses` (Phase 1). May need a `calendar_connections` table (id, user_id, provider, access_token, refresh_token, connected_at) — store tokens encrypted.

## Definition of done
- User can connect and disconnect their calendar at any time
- Detected events surface as suggestions, not automatic entries
- Confirming a suggestion creates a correctly pre-filled expense entry
- No expense is ever created without explicit user action
