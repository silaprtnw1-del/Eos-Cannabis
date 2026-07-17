// ISO 8601 week/year — a batch id is scoped to the week it was created,
// not the calendar year, so the boundary case (e.g. Dec 31 falling in
// week 1 of the next ISO year) must resolve to the ISO year, not getUTCFullYear().
function getIsoWeekInfo(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { isoYear, isoWeek };
}

export function generateBatchId(acronym: string, date: Date = new Date()): string {
  const { isoYear, isoWeek } = getIsoWeekInfo(date);
  return `BATCH-${isoYear}-W${String(isoWeek).padStart(2, '0')}-${acronym.toUpperCase()}`;
}
