import type { Response } from "express";
// @ts-ignore -- pdfkit ships without TypeScript declarations
import PDFDocument from "pdfkit";
import { subDays } from "date-fns";
import type { IStorage } from "../storage";

export interface PDFExportOptions {
  type: "all" | "emotions" | "thoughts" | "journals" | "goals";
  period: "week" | "month" | "all";
  targetUserId: number;
  subjectName: string;
}

/**
 * Build the whole document before sending headers. A failed data read or PDF
 * stream must return an error, not a successful but truncated download.
 * Private report bytes are kept in memory, never in shared temporary files.
 */
export async function exportPDF(
  options: PDFExportOptions,
  storage: IStorage,
  res: Response,
): Promise<void> {
  const { type, period, targetUserId, subjectName } = options;
  const now = new Date();
  const start = period === "all" ? null : subDays(now, period === "week" ? 7 : 30);
  const inPeriod = (date: Date | string) => {
    const timestamp = new Date(date).getTime();
    return Number.isFinite(timestamp) && (!start || timestamp >= start.getTime());
  };
  const sections: { title: string; entries: string[][] }[] = [];
  if (type === "all" || type === "emotions") {
    const records = await storage.getEmotionRecordsByUser(targetUserId);
    sections.push({
      title: "Emotion Records",
      entries: records.filter(r => inPeriod(r.timestamp)).map(r => [
        `Date: ${new Date(r.timestamp).toISOString()}`,
        `Emotion: ${[r.coreEmotion, r.primaryEmotion, r.tertiaryEmotion].filter(Boolean).join(" / ")}`,
        `Intensity: ${r.intensity}`, `Situation: ${r.situation}`,
      ]),
    });
  }
  if (type === "all" || type === "thoughts") {
    const records = await storage.getThoughtRecordsByUser(targetUserId);
    sections.push({
      title: "Thought Records",
      entries: records.filter(r => inPeriod(r.createdAt)).map(r => [
        `Date: ${new Date(r.createdAt).toISOString()}`,
        `Automatic thoughts: ${r.automaticThoughts}`,
        `Cognitive distortions: ${r.cognitiveDistortions.join(", ")}`,
        `Evidence for: ${r.evidenceFor || "None recorded"}`,
        `Evidence against: ${r.evidenceAgainst || "None recorded"}`,
        `Alternative perspective: ${r.alternativePerspective || "None recorded"}`,
      ]),
    });
  }
  if (type === "all" || type === "journals") {
    const records = await storage.getJournalEntriesByUser(targetUserId);
    sections.push({
      title: "Journal Entries",
      entries: records.filter(r => inPeriod(r.createdAt)).map(r => [
        `${r.title || "Untitled Entry"} - ${new Date(r.createdAt).toISOString()}`,
        r.content,
      ]),
    });
  }
  if (type === "all" || type === "goals") {
    const records = await storage.getGoalsByUser(targetUserId);
    sections.push({
      title: "Goals",
      entries: records.filter(r => inPeriod(r.createdAt)).map(r => [
        `Goal: ${r.title}`, `Created: ${new Date(r.createdAt).toISOString()}`,
        `Status: ${r.status}`, `Specific: ${r.specific}`,
        `Measurable: ${r.measurable}`, `Achievable: ${r.achievable}`,
        `Relevant: ${r.relevant}`, `Timebound: ${r.timebound}`,
      ]),
    });
  }

  const doc = new PDFDocument({
    margin: 50,
    info: { Title: "ResilienceHub CBT Report", Author: "ResilienceHub" },
  });
  const chunks: Buffer[] = [];
  const bytes = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
  try {
    doc.fontSize(20).text("CBT Data Report").moveDown();
    doc.fontSize(12).text(`Subject: ${subjectName} (ID: ${targetUserId})`);
    doc.text(`Period: ${period === "all" ? "All Time" : period === "week" ? "Past Week (7 days)" : "Past Month (30 days)"}`);
    if (start) doc.text(`Records created since: ${start.toISOString()}`);
    doc.text(`Generated: ${now.toISOString()}`);
    doc.text("Includes emotion records, thought records, journal entries and goals as selected.").moveDown();
    sections.forEach((section, index) => {
      if (index > 0) doc.addPage();
      doc.fontSize(16).text(`${section.title} (${section.entries.length})`).moveDown();
      doc.fontSize(10);
      if (!section.entries.length) doc.text("No records in this period.");
      section.entries.forEach(lines => {
        if (doc.y > doc.page.height - 160) doc.addPage();
        lines.forEach(line => doc.text(line));
        doc.moveDown();
      });
    });
    doc.end();
  } catch (error) {
    doc.destroy();
    // Observe a possible stream rejection even if rendering threw first.
    void bytes.catch(() => {});
    throw error;
  }
  const buffer = await bytes;
  res.type("application/pdf");
  res.attachment(`resiliencehub-${type}-${period}.pdf`);
  res.send(buffer);
}
