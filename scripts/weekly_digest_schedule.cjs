/**
 * Shared automatic-run policy. Defaults match engagement_settings and the admin UI.
 * Times use the server's local timezone, just like daily reminders.
 * Only a missing row gets defaults; malformed saved settings fail closed.
 */
function weeklyDigestSlot(settings, now = new Date(), scheduled = true) {
  const config = settings == null ? {
    weekly_digest_enabled: true,
    weekly_digest_day: 0,
    weekly_digest_time: '08:00',
  } : settings;
  if (config.weekly_digest_enabled === false) return null;
  if (config.weekly_digest_enabled !== true ||
      !Number.isInteger(config.weekly_digest_day) ||
      config.weekly_digest_day < 0 || config.weekly_digest_day > 6 ||
      typeof config.weekly_digest_time !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(config.weekly_digest_time)) {
    throw new Error('Invalid weekly digest settings');
  }
  if (!scheduled) return 'manual';
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (now.getDay() !== config.weekly_digest_day || time !== config.weekly_digest_time) return null;
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}T${time}`;
}

module.exports = { weeklyDigestSlot };
