// All date helpers operate in the user's *local* timezone.
// Using toISOString() (UTC) here causes off-by-one errors east of UTC: e.g.
// local-midnight Monday in UTC+3 serializes to "Sunday 21:00 UTC", which then
// formats as the wrong calendar date.

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayString(): string {
  return toDateString(new Date())
}

export function yesterdayString(): string {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return toDateString(y)
}

export function isToday(dateString: string): boolean {
  return dateString === todayString()
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Returns the seven dates of the current calendar week (Mon → Sun) in the
 * user's local timezone, each set to local midnight.
 */
export function buildCurrentWeekDates(): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay() // 0=Sun, 1=Mon, ... 6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    return d
  })
}
