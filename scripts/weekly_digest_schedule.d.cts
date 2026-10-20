/**
 * Returns the due local-time slot, "manual" for an enabled manual run, or null
 * when disabled/not due. Missing settings use defaults; invalid settings throw.
 */
export function weeklyDigestSlot(
  settings: {
    weekly_digest_enabled: boolean;
    weekly_digest_day: number;
    weekly_digest_time: string;
  } | null | undefined,
  now?: Date | undefined,
  scheduled?: boolean | undefined,
): string | null;
