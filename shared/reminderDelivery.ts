export interface ReminderDeliveryResult {
  success: true;
  inactiveClients: number;
  notificationsSent: number;
  notificationsFailed: number;
  emailsSent: number;
  emailsFailed: number;
  emailsEnabled: boolean;
  hasFailures: boolean;
  message: string;
}

type ReminderDeliveryField = Extract<keyof ReminderDeliveryResult, string>;
type ReminderDeliverySentField = Extract<ReminderDeliveryField, `${string}Sent`>;
type ReminderDeliveryFailedField = Extract<ReminderDeliveryField, `${string}Failed`>;
type ReminderDeliveryEnabledField = Extract<ReminderDeliveryField, `${string}Enabled`>;

export interface ReminderDeliveryChannelDefinition {
  label: string;
  sent: ReminderDeliverySentField;
  failed: ReminderDeliveryFailedField;
  enabledBy?: ReminderDeliveryEnabledField;
  disabledMessage?: string;
}

type MissingReminderDeliveryFields<T extends readonly ReminderDeliveryChannelDefinition[]> =
  | Exclude<ReminderDeliverySentField, T[number]["sent"]>
  | Exclude<ReminderDeliveryFailedField, T[number]["failed"]>
  | Exclude<ReminderDeliveryEnabledField, Exclude<T[number]["enabledBy"], undefined>>;

export function defineReminderDeliveryChannels<
  const T extends readonly ReminderDeliveryChannelDefinition[],
>(
  channels: T & (
    [MissingReminderDeliveryFields<T>] extends [never]
      ? unknown
      : { __missingReminderDeliveryFields: MissingReminderDeliveryFields<T> }
  ),
): T {
  return channels;
}

export const reminderDeliveryChannels = defineReminderDeliveryChannels([
  {
    label: "In-app notifications",
    sent: "notificationsSent",
    failed: "notificationsFailed",
    enabledBy: undefined,
    disabledMessage: undefined,
  },
  {
    label: "Emails",
    sent: "emailsSent",
    failed: "emailsFailed",
    enabledBy: "emailsEnabled",
    disabledMessage: "Email delivery is disabled; no emails attempted.",
  },
] as const);
