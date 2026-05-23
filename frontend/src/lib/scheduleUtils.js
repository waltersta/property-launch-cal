export const HOLIDAYS = {
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'MLK Day',
  '2026-02-16': "Presidents' Day",
  '2026-05-10': "Mother's Day",
  '2026-05-25': 'Memorial Day',
  '2026-06-19': 'Juneteenth',
  '2026-06-21': "Father's Day",
  '2026-07-03': 'Independence Day (obs.)',
  '2026-07-04': 'Independence Day',
  '2026-09-07': 'Labor Day',
  '2026-10-12': 'Columbus Day',
  '2026-11-11': 'Veterans Day',
  '2026-11-26': 'Thanksgiving',
  '2026-12-25': 'Christmas Day',
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startOffset = first.getDay()
  const cells = []
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    cells.push({ date: d, inMonth: false })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const prev = cells[cells.length - 1].date
    const next = new Date(prev)
    next.setDate(next.getDate() + 1)
    cells.push({ date: next, inMonth: false })
  }
  return cells
}

export function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatLongDate(s) {
  const d = parseISO(s)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(s) {
  const d = parseISO(s)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function eventsOnDate(events, isoStr) {
  return events.filter((e) => {
    if (e.status === 'awaiting_pick') {
      return (e.date_options || []).includes(isoStr)
    }
    if (!e.date) return false
    const start = e.date
    const end = e.end_date || e.date
    return isoStr >= start && isoStr <= end
  })
}

/** Events that touch a calendar month (for per-month legend). */
export function eventsInCalendarMonth(events, year, month) {
  const m = String(month + 1).padStart(2, '0')
  const monthStart = `${year}-${m}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${m}-${String(lastDay).padStart(2, '0')}`

  return events.filter((e) => {
    if (e.status === 'awaiting_pick') {
      return (e.date_options || []).some((d) => d >= monthStart && d <= monthEnd)
    }
    if (!e.date) return false
    const end = e.end_date || e.date
    return e.date <= monthEnd && end >= monthStart
  })
}

export function categoryLabel(cat) {
  const map = {
    keys: 'Keys',
    inspection: 'Inspection',
    staging: 'Staging',
    photo: 'Photo',
    listing: 'Listing',
    general: 'General',
  }
  return map[cat] || cat
}

export function categoryColor(cat) {
  const map = {
    inspection: 'bg-sky-100 text-sky-900',
    staging: 'bg-violet-100 text-violet-900',
    photo: 'bg-amber-100 text-amber-900',
    listing: 'bg-emerald-100 text-emerald-900',
    keys: 'bg-yellow-100 text-yellow-900',
    general: 'bg-zinc-100 text-zinc-800',
  }
  return map[cat] || map.general
}

const AGENT_NAME = 'Walter Stauss'

/** User-facing event name (calendar chips, timeline headings). */
export function eventDisplayName(event) {
  const title = (event.title || '').trim()
  if (title.includes('—')) {
    return title.split('—').pop().trim()
  }
  if (event.category === 'keys' || /key handover/i.test(title)) return 'Key Handover'
  if (event.category === 'staging') return 'Staging'
  if (event.category === 'listing' || /listing goes live/i.test(title)) return 'Listing Live'
  return title
}

/** @deprecated alias */
export function calendarEventShortName(event) {
  return eventDisplayName(event)
}

export function isTwoPartyKeyEvent(event) {
  return event.category === 'keys' || /key handover/i.test(event.title || '')
}

export function timelineEventTitle(event) {
  return eventDisplayName(event)
}

export { AGENT_NAME }
