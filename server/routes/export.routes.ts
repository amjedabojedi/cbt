import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { storage } from "../storage";
import { exportPDF } from "../services/pdfExport";

const router = Router();
const querySchema = z.object({
  type: z.enum(["all", "emotions", "thoughts", "journals", "goals"]).default("all"),
  period: z.enum(["week", "month", "all"]).default("all"),
  clientId: z.string().regex(/^[1-9]\d*$/).transform(Number)
    .pipe(z.number().int().max(2_147_483_647)).optional(),
}).strict();

router.get("/pdf", (_req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  res.set("X-Content-Type-Options", "nosniff");
  next();
}, authenticate, async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid export options" });
    return;
  }
  try {
    // Refresh the actor rather than relying on a cached role for a private export.
    const actor = await storage.getUser(req.user.id);
    if (!actor || !["client", "therapist", "admin"].includes(actor.role)) {
      res.status(403).json({ message: "Export access denied" });
      return;
    }
    const targetId = parsed.data.clientId ?? actor.id;
    const subject = targetId === actor.id ? actor : await storage.getUser(targetId);
    if (!subject) {
      res.status(404).json({ message: "Export subject not found" });
      return;
    }
    const isOwner = targetId === actor.id;
    const canViewClient = subject.role === "client" && (
      actor.role === "admin" ||
      (actor.role === "therapist" && subject.therapistId === actor.id)
    );
    if (!isOwner && !canViewClient) {
      res.status(403).json({ message: "Export access denied" });
      return;
    }
    await exportPDF({
      type: parsed.data.type,
      period: parsed.data.period,
      targetUserId: subject.id,
      subjectName: subject.name,
    }, storage, res);
  } catch {
    // Do not include database errors, identifying metadata or therapy text.
    res.status(500).json({ message: "Failed to generate PDF report" });
  }
});

export default router;
