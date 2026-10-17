/** Practice counts describe use of tools, not a clinical outcome or treatment target. */
export function practiceMilestone(count: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const target = [3, 10, 25, 50].find(value => value > total) ?? (Math.floor(total / 50) + 1) * 50;
  return { total, target, remaining: target - total, percent: Math.min(100, Math.round(total / target * 100)) };
}

export function isRecordedToday(value: string | Date | null | undefined, now = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
}
