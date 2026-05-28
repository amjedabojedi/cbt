# Resource Assignments — Client Completion & Rating Flow

**Date:** May 28, 2026

---

## Overview

This update adds a full end-to-end flow for resource assignments between therapists and clients. Therapists can assign resources and monitor client engagement. Clients can open, mark as complete, and rate resources from a dedicated tab.

---

## What Was Built

### For Clients — "My Resources" Tab

Clients now see a **My Resources** tab in the Resource Library (`/library`).

Each assignment card shows:
- Resource title, category chip, and type (article / worksheet / guide / exercise / video)
- Therapist's note (if any) in a teal callout box
- Status badge: **New** (amber) → **Viewed** (blue) → **Completed** (green)
- Color-coded left border matching the status

**Actions available to the client:**

| Button | What it does |
|---|---|
| **Open Resource** | Opens the resource viewer. Silently marks status as "Viewed" in the background on first open. |
| **Mark as Ready ✓** | Marks the resource as Completed. Immediately opens the rating dialog. |
| **Rate** | Opens the rating dialog (shown only if not yet rated). |

**Rating Dialog:**
- 5 clickable stars with hover highlight
- Label updates based on stars selected (Not helpful → Extremely helpful)
- Optional comment field ("Any comments for your therapist?")
- **Submit Rating** button or **Skip** link
- Rating and comment are stored and visible to the therapist

Once rated, the card shows the star rating and the comment text. The Rate button disappears so clients cannot rate twice.

---

### For Therapists — "Client Assignments" Tab Enhancements

#### Engagement Summary Stats Bar

A stats panel appears above the assignment list when assignments exist:

| Tile | Shows |
|---|---|
| Total assigned | All assignments across all clients |
| Assigned | Resources not yet opened |
| Viewed | Resources opened but not completed |
| Completed | Resources marked as ready by clients |

Below the tiles:
- **Average star rating** across all rated assignments (with count)
- **Filter buttons**: All / Assigned / Viewed / Completed — click to narrow the list

#### Per-Assignment Card Enhancements

Each assignment card now shows:
- Color-coded left border (slate = assigned, blue = viewed, green = completed)
- **Client's star rating** (or "Not rated yet" in grey)
- **Client's comment** (if provided) in italic below the stars
- **Completion date** when status is Completed

---

## Backend Changes

### New API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/client/assignments` | Returns all assignments for the logged-in client, enriched with resource details and the client's own feedback |
| `PATCH` | `/api/resource-assignments/:id/status` | Updates assignment status to "viewed" or "completed". Ownership-checked (only the assigned client can call this). |
| `POST` | `/api/resource-assignments/:id/feedback` | Submits a star rating (1–5) and optional comment. Returns 409 if feedback already exists for this resource + user. |

### Updated Route

**`GET /api/therapist/assignments`** — now enriches each assignment with the client's feedback (rating + comment), batch-fetched per unique client for efficiency.

---

## Files Changed

| File | Change |
|---|---|
| `server/controllers/resources.controller.ts` | Added `getClientAssignments`, `updateResourceAssignmentStatus`, `submitAssignmentFeedback`. Updated `getTherapistAssignments` to include client feedback. |
| `server/routes/resources.routes.ts` | Registered the 3 new routes with `authenticate` middleware |
| `client/src/features/resources/types.ts` | Added `ResourceFeedback` interface; extended `ResourceAssignment` with `completedAt`, `feedback`, `assignedTo`, `client` fields |
| `client/src/features/resources/hooks/useResources.ts` | Added `useMyAssignments`, `useUpdateAssignmentStatus`, `useSubmitFeedback` hooks |
| `client/src/features/resources/pages/ResourceLibrary.tsx` | Added My Resources tab, rating dialog, engagement stats bar, filter buttons, therapist card enhancements |
| `client/src/features/resources/utils/resourceLabels.ts` | Added "assigned" and "viewed" to the status label map |
| `client/src/features/dashboard/pages/Clients.tsx` | Fixed crash caused by undefined `isSelected` / `selectedClientId` variables introduced by a merge conflict |

---

## Bug Fixes

### Clients Page Crash (`Clients.tsx`)
A merge from a background task agent introduced a duplicate `className` attribute and referenced `isSelected` / `selectedClientId` variables that were never defined. This caused the entire Clients page to crash with `ReferenceError: isSelected is not defined` / `selectedClientId is not defined`.

**Fix:** Added `const [selectedClientId, setSelectedClientId] = useState<number | null>(null)` state and removed the duplicate static `className`, merging both into a single conditional class string.

---

## How to Test

1. **Log in as a therapist** → go to Resource Library → Educational Resources tab → assign a resource to a client
2. **Log in as that client** → go to Resource Library → click **My Resources** tab
3. Click **Open Resource** — status changes to Viewed
4. Click **Mark as Ready ✓** — status changes to Completed, rating dialog opens
5. Select stars, optionally add a comment, click **Submit Rating**
6. **Log back in as the therapist** → Resource Library → Client Assignments tab → see the stats bar and the client's rating on the card
