# Engagement reminder audiences

The admin report, admin inactivity preview, admin manual reminder send, and
automatic daily reminder service share one definition:

- Only active client accounts are eligible.
- The clock starts at the latest **saved** emotion record (`created_at`), not
  its recorded/occurrence date (`timestamp`).
- With no emotion records, the clock starts at account creation. New clients
  receive the entire grace period; they are not treated as having recorded activity.
- Days are full 24-hour periods, not calendar-date changes. A client exactly at
  the cutoff is eligible.
- Thought records, journal entries, and goals do not reset this clock.

The automatic scheduler, including its admin trigger, reads the saved
`reminderEnabled` and `reminderDays` settings on each run. Missing settings use
the existing enabled/three-day defaults. Invalid thresholds or failed reads
abort delivery rather than silently reporting an empty audience. Explicit service
configurations can choose a threshold and delivery channels; they are internal
callers, not an independently scheduled audience.

The report/manual endpoints use the requested threshold (three days by default).
The admin screen requests the saved period for its report and uses the displayed
period for a confirmed manual send. Editing an unsaved setting does not change
the automatic audience. Manual delivery is a deliberate action independent of
the automatic enabled flag.

## Legacy controller

`server/controllers/inactivityReminders.ts` historically checks activity across
four tools. It is **not mounted** in the current route tree; there is no live
`/api/client-engagement` audience. It is not evidence of a separately approved
therapist inactivity policy. Keep it unmounted unless a product decision and
authorization review explicitly establish a new audience. Current admin routes
use `admin.controller.ts`, not that controller.

## Daily schedule

`reminderTime` is a 24-hour `HH:mm` time in **UTC**, as labeled in the admin
screen. It is not the admin browser's or server's local timezone. UTC has no
daylight-saving gaps or repeated hours: the UTC send time stays fixed when a
server or recipient changes daylight-saving offset. Local receipt time may shift.

The scheduler reads persisted settings immediately on startup and at each UTC
minute boundary. A missing settings row uses enabled/09:00 defaults. Invalid
saved times or failed settings reads skip delivery, without a fallback send.
Saved time/enabled changes are picked up by the next check, without restarting;
the delivery service re-reads enabled/threshold settings before choosing clients.
Unsaved admin edits have no effect.

Startup anywhere within the selected minute runs immediately, including its
last second. Startup after that minute does **not** catch up; the next
opportunity is tomorrow. Moving the time to an already-passed minute likewise
waits until tomorrow. A delayed settings read uses the current minute when it
finishes, not the minute in which it started.

Only one automatic attempt per UTC date is allowed within a scheduler instance,
even if the admin moves the time later after a run. Overlapping checks are
suppressed. Stopping cancels future checks and invalidates pending settings
reads, but cannot cancel delivery already started. Starting twice is harmless.
These are process-local scheduling guards, not durable delivery guarantees:
restarts, multiple app instances, per-recipient failures, retries, and manual
sends still require the separate retry/deduplication work. An attempted run is
not retried automatically after failure. Manual admin triggers remain immediate,
respect enabled/threshold settings, bypass the time gate, and do not consume
the automatic daily slot.

Weekly digests retain their existing server-local Sunday 08:00 hourly check.
Email customization and escalation behavior are unchanged.

## Safe verification

Tests use a newly owned disposable PostgreSQL cluster with only synthetic dates
and accounts. Database imports and delivery modules are replaced before loading
the services. Email and notifications are mocked, and no existing therapy data
is read or changed.
Scheduler timing tests additionally use a fake clock, mocked settings reads,
and a mocked reminder processor: no database or delivery transport is loaded.
