export function slotToMinutes(slot) {
  const lower  = slot.toLowerCase();
  const isPm   = lower.includes('pm');
  const digits = lower.replace(/[apm\s]/g, '');
  const [h, m] = digits.split(':').map(Number);
  let hours = h;
  if (isPm && h !== 12) hours += 12;
  if (!isPm && h === 12) hours = 0;
  return hours * 60 + (m || 0);
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
