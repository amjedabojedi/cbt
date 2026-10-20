import type { ReminderDeliveryResult } from "@shared/reminderDelivery";
import { z } from "zod";

const deliveryCountSchema = z.number().int().nonnegative().safe();
export const reminderDeliveryReceiptSchema = z.object({
  success: z.literal(true),
  inactiveClients: deliveryCountSchema,
  notificationsSent: deliveryCountSchema,
  notificationsFailed: deliveryCountSchema,
  emailsSent: deliveryCountSchema,
  emailsFailed: deliveryCountSchema,
  emailsEnabled: z.boolean(),
  hasFailures: z.boolean(),
  message: z.string(),
}).refine(result =>
  result.notificationsSent + result.notificationsFailed === result.inactiveClients
  && (result.emailsEnabled
    ? result.emailsSent + result.emailsFailed === result.inactiveClients
    : result.emailsSent === 0 && result.emailsFailed === 0)
  && result.hasFailures === (result.notificationsFailed > 0 || result.emailsFailed > 0),
{ message: "Inconsistent reminder delivery receipt" });

export interface ReminderDeliverySummary {
  title: string;
  description: string;
  variant?: "destructive";
}

export function reminderDeliverySummary(result: ReminderDeliveryResult): ReminderDeliverySummary {
  const hasFailures = result.notificationsFailed + result.emailsFailed > 0;
  const anySent = result.notificationsSent + result.emailsSent > 0;
  return {
    title: hasFailures
      ? (anySent ? "Reminders Partially Sent" : "No Reminders Sent")
      : (result.inactiveClients === 0 ? "No Eligible Clients" : "Reminders Sent"),
    description: `In-app notifications: ${result.notificationsSent} sent, ${result.notificationsFailed} failed. ${
      result.emailsEnabled
        ? `Emails: ${result.emailsSent} sent, ${result.emailsFailed} failed.`
        : "Email delivery is disabled; no emails attempted."
    }${anySent ? " Sending again may duplicate reminders that already succeeded." : ""}`,
    ...(hasFailures ? { variant: "destructive" as const } : {}),
  };
}
