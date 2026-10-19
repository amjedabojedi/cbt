import { pool } from "../db";

export const DEFAULT_ENGAGEMENT_DAYS = 3;

export function engagementDays(value: unknown): number {
  if (value === undefined) return DEFAULT_ENGAGEMENT_DAYS;
  const days = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new RangeError("Days must be a whole number between 1 and 365");
  }
  return days;
}

// Shared by reports, inactivity previews, manual delivery, and automatic reminders.
// Read only activity dates, never the contents of therapy records.
export async function getAdminClientEngagement(days: number, now = new Date()) {
  days = engagementDays(days);
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const result = await pool.query<{
    id: number;
    name: string;
    email: string;
    therapistId: number | null;
    createdAt: Date | string;
    lastEmotionAt: Date | string | null;
  }>(`
    SELECT u.id, u.name, u.email, u.therapist_id AS "therapistId",
      u.created_at AS "createdAt", MAX(e.created_at) AS "lastEmotionAt"
    FROM users u
    LEFT JOIN emotion_records e ON e.user_id = u.id
    WHERE u.role = 'client' AND u.status = 'active'
    GROUP BY u.id
  `);

  return result.rows.map(client => {
    const lastActivity = new Date(client.lastEmotionAt ?? client.createdAt).getTime();
    if (!Number.isFinite(lastActivity)) throw new Error("Invalid engagement activity date");
    return { ...client, inactive: lastActivity <= cutoff };
  });
}
