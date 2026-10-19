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
