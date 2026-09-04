export const CALENDAR_ZONES = ['Asia/Shanghai', 'Asia/Bangkok'];
export function calendarDate(value, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('-');
}
export function moveDate(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function weekStart(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return moveDate(date, -((day + 6) % 7));
}
export function monthDates(date) {
  const first = `${date.slice(0, 7)}-01`;
  const start = weekStart(first);
  const last = new Date(`${first}T12:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const count = Math.ceil((Math.round((last - new Date(`${start}T12:00:00Z`)) / 86400000) + 1) / 7) * 7;
  return Array.from({ length: count }, (_, index) => moveDate(start, index));
}
export function eventDate(event, timeZone) {
  // A date-only premiere is not a midnight broadcast timestamp.
  return event.airsAt ? calendarDate(event.airsAt, timeZone) : event.date;
}
export function eventStatus(event, now, sourceTimeZone = 'Asia/Bangkok') {
  if (event.needsReview) return 'review';
  if (event.airsAt) return Date.parse(event.airsAt) <= now ? 'aired' : 'upcoming';
  // A confirmed date still has no exact broadcast time. Classify the day in
  // the source's time zone without inventing a midnight premiere timestamp.
  const today = calendarDate(now, sourceTimeZone);
  return event.date < today ? 'aired' : event.date > today ? 'upcoming' : 'airingToday';
}

export function scheduleStats(events, now = Date.now(), timeZone = 'Asia/Bangkok') {
  const totals = { aired: 0, upcoming: 0, airingToday: 0, review: 0 };
  const dates = new Map();
  for (const event of events) {
    const status = eventStatus(event, now);
    totals[status]++;
    if (status === 'review') continue;
    const date = eventDate(event, timeZone);
    const row = dates.get(date) || { date, events: 0, aired: 0, upcoming: 0, airingToday: 0, seriesIds: new Set() };
    row.events++;
    row[status]++;
    row.seriesIds.add(event.seriesId);
    dates.set(date, row);
  }
  return { generatedAt: new Date(now).toISOString(), timeZone, totals,
    dates: [...dates.values()].sort((a, b) => a.date.localeCompare(b.date)).map(({ seriesIds, ...row }) => ({ ...row, series: seriesIds.size })) };
}
