// Historical records are independent of the rolling weekly feed. Current
// records take precedence, including review flags, without deleting old dates.
export function mergeCalendarData(history, current) {
  const series = new Map([...history.series, ...current.series].map((item) => [item.id, item]));
  const events = new Map([...history.events, ...current.events].map((event) => [event.id, event]));
  return { ...current, historyCheckedAt: history.checkedAt, series: [...series.values()],
    events: [...events.values()].filter((event) => event.kind !== 'premiere'
      || !events.has(`${event.seriesId}:ep:1`))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.airsAt || '').localeCompare(b.airsAt || '') || (a.episode || 0) - (b.episode || 0)) };
}
