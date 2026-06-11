import { Router } from "express";
import subscriptionsRouter from "./subscriptions.routes";
import authRouter from "./auth.routes";
import usersRouter from "./users.routes";
import emotionsRouter from "./emotions.routes";
import thoughtsRouter from "./thoughts.routes";
import { getSingleThoughtRecord } from "../controllers/thoughts.controller";
import goalsRouter from "./goals.routes";
import journalRouter from "./journal.routes";
import adminRouter from "./admin.routes";
import notificationsRouter from "./notifications.routes";
import resourcesRouter from "./resources.routes";
import translateRouter from "./translate.routes";
import transcribeRouter from "./transcribe.routes";
import invitationsRouter from "./invitations.routes";

const router = Router();

// API Routes
router.use("/subscription-plans", subscriptionsRouter); // Updated base path
router.use("/subscription", subscriptionsRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/users/:userId/emotions", emotionsRouter);
// Note: thoughtsRouter contains both / (mounted at /users/:userId/thoughts) AND /thoughts/...
// We only mount it at /users/:userId/thoughts to avoid global catch-all conflicts like /:thoughtId
router.use("/users/:userId/thoughts", thoughtsRouter);

// Explicitly register /thoughts/:id which doesn't need userId context
// Note: We avoid mounting thoughtsRouter at '/' because it contains catch-all routes (like /:thoughtId)
// that would break other paths (e.g. /notifications).
import { authenticate } from "../middleware/auth";
router.get("/thoughts/:id", authenticate, getSingleThoughtRecord);

// Note: goalsRouter contains both / (mounted at /users/:userId/goals) AND /goals/... / /milestones/...
router.use("/users/:userId/goals", goalsRouter);
router.use("/", goalsRouter); // contains /goals/...
router.use("/", journalRouter); // contains /journal/...
router.use("/", adminRouter); // contains /admin/...
router.use("/notifications", notificationsRouter);
router.use("/", resourcesRouter); // contains /resources/..., /therapist/assignments, /resource-assignments/...
router.use("/", translateRouter); // contains /translate
router.use("/", transcribeRouter); // contains /transcribe
router.use("/", invitationsRouter); // contains /invitations

export default router;
