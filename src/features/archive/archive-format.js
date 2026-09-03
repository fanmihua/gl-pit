export function formatArchiveDate(date) {
  if (!date) return "待公布";
  return date.replaceAll("-", ".");
}

export function formatArchiveRange(event) {
  if (!event.endDate) return `${formatArchiveDate(event.startDate)} 起`;
  return `${formatArchiveDate(event.startDate)} — ${formatArchiveDate(event.endDate)}`;
}
