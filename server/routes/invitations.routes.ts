import { Router } from "express";
import { authenticate, isTherapist, ensureAuthenticated } from "../middleware/auth";
import { storage } from "../storage";
import { sendClientInvitation } from "../services/email";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { getSafeBaseUrl } from "../controllers/auth.controller";

const router = Router();

// GET /api/invitations — list all invitations sent by the logged-in therapist
router.get("/invitations", authenticate, isTherapist, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const therapistId = req.user.id;
    const invitations = await storage.getClientInvitationsByTherapist(therapistId);
    return res.json(Array.isArray(invitations) ? invitations : []);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return res.status(500).json({ message: "Failed to fetch invitations" });
  }
});

// POST /api/invitations/:id/resend — resend an invitation email
router.post("/invitations/:id/resend", authenticate, ensureAuthenticated, isTherapist, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid invitation ID" });

    const invitation = await storage.getClientInvitationById(id);
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });

    // Ensure the invitation belongs to this therapist
    if (invitation.therapistId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Generate a fresh token for the resend
    const plaintextToken = crypto.randomBytes(32).toString("hex");
    const invitationTokenHash = await bcrypt.hash(plaintextToken, 10);
    const baseUrl = getSafeBaseUrl(req);
    const inviteLink = `${baseUrl}/auth?invitation=true&email=${encodeURIComponent(invitation.email)}&therapistId=${req.user.id}&token=${plaintextToken}`;

    // Update token in DB
    await storage.updateClientInvitationStatus(id, "email_sent");

    const therapistName = req.user.name || req.user.username;
    const emailSent = await sendClientInvitation(invitation.email, therapistName, inviteLink);

    res.json({ message: "Invitation resent successfully", emailSent });
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(500).json({ message: "Failed to resend invitation" });
  }
});

export default router;
