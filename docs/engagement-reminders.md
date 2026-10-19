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

## Unchanged scheduling limits

This change aligns eligibility, not the scheduler's timing mechanism, weekly
digest behavior, email customization, or escalation implementation. Daily runs
still use the scheduler's existing server-local 9 AM polling schedule; the saved
reminder time is not applied by that mechanism.

## Safe verification

Tests use a newly owned disposable PostgreSQL cluster with only synthetic dates
and accounts. Database imports and delivery modules are replaced before loading
the services. Email and notifications are mocked, and no existing therapy data
is read or changed.
