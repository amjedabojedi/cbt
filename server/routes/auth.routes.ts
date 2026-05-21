import { Router } from "express";
import { authenticate, isTherapist } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimiter";
import { ensureAuthenticated } from "../middleware/auth";
import {
  registerUser,
  inviteClient,
  requestForgotPassword,
  verifyResetToken,
  executePasswordReset,
  loginUser,
  mobileLoginUser,
  logoutUser,
  getMe
} from "../controllers/auth.controller";

const router = Router();

// Authentication and registration routes
router.post("/register", authRateLimit, registerUser);
router.post("/login", authRateLimit, loginUser);
router.post("/mobile-login", authRateLimit, mobileLoginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, ensureAuthenticated, getMe);

// Invitation route (Therapist invites client)
router.post("/invite-client", authenticate, ensureAuthenticated, isTherapist, inviteClient);

// Password reset routes
router.post("/forgot-password", authRateLimit, requestForgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password", authRateLimit, executePasswordReset);

export default router;
