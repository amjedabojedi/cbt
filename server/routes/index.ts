import { Router } from "express";
import subscriptionsRouter from "./subscriptions.routes";
import authRouter from "./auth.routes";
import usersRouter from "./users.routes";
import emotionsRouter from "./emotions.routes";
import thoughtsRouter from "./thoughts.routes";
import goalsRouter from "./goals.routes";
import journalRouter from "./journal.routes";
import adminRouter from "./admin.routes";
import notificationsRouter from "./notifications.routes";
import resourcesRouter from "./resources.routes";

const router = Router();

// API Routes
router.use("/subscription-plans", subscriptionsRouter); // Updated base path
router.use("/subscription", subscriptionsRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/users/:userId/emotions", emotionsRouter);
// Note: thoughtsRouter contains both / (mounted at /users/:userId/thoughts) AND /thoughts/...
// This is somewhat irregular, but to make it work:
router.use("/users/:userId/thoughts", thoughtsRouter);
router.use("/", thoughtsRouter); // to catch /thoughts/:id
// Note: goalsRouter contains both / (mounted at /users/:userId/goals) AND /goals/... / /milestones/...
router.use("/users/:userId/goals", goalsRouter);
router.use("/", goalsRouter); // contains /goals/...
router.use("/", journalRouter); // contains /journal/...
router.use("/", adminRouter); // contains /admin/...
router.use("/notifications", notificationsRouter);
router.use("/", resourcesRouter); // contains /resources/..., /therapist/assignments, /resource-assignments/...

export default router;
