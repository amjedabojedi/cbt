---
name: Admin engagement policy
description: Confirmed inactivity rule for admin reports, checks, manual reminders, and automatic reminders.
---

Admin reports, inactivity checks, manual reminders, and automatic daily reminders must use the same rule: active client accounts only, measured from the last saved emotion record, or account creation when no emotion history exists.

**Why:** The user explicitly chose this shared definition instead of preserving the conflicting definitions and requested parity for automatic reminders. New clients must receive a full inactivity period before becoming eligible.

**How to apply:** Use full 24-hour days, include the exact cutoff as inactive, and distinguish saved dates from emotion dates. Newly joined clients within their grace period are not evidence of recorded activity. Do not interpret historical multi-tool reminder code as approval for a different therapist-facing inactivity policy; establish that audience explicitly before exposing one.

Daily reminder scheduling uses UTC rather than guessing a regional timezone from the language, server, or admin browser.

**Why:** Saved settings contain a time but no timezone. An explicit UTC contract avoids silently changing delivery when hosting location or daylight-saving offsets change. No regional business timezone has been established.

**How to apply:** Keep the admin-facing timezone explanation consistent with scheduling. A future regional-timezone feature needs an explicit product decision, including missing/repeated local times; do not infer it from Arabic UI or hosting settings. Durable retry and cross-process duplicate prevention remain separate from time selection.
Weekly summaries must remain separate from the daily inactivity audience.

**Why:** The user explicitly stated that weekly summaries have their own purpose; aligning daily reminders is not permission to restrict weekly summaries to inactive clients.

**How to apply:** When changing digest settings or scheduling, preserve the separate weekly audience rather than reusing daily inactivity eligibility.
