import { z } from "zod";

const countSchema = z.number().int().nonnegative().safe();

export const engagementAudienceSchema = z.object({
  activeClients: countSchema,
  inactiveClients: countSchema,
});

// No durable delivery ledger exists. Null means unknown, never a measured zero.
export const untrackedDeliveryHistorySchema = z.object({
  deliveryHistoryStatus: z.literal("not_tracked"),
  totalEmailsSent: z.null(),
  totalNotificationsSent: z.null(),
  lastRunTime: z.null(),
});

export const engagementStatsSchema = engagementAudienceSchema.merge(untrackedDeliveryHistorySchema);
export type EngagementStats = z.infer<typeof engagementStatsSchema>;
