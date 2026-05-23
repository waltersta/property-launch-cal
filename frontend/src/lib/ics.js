function pad(n) {
  return String(n).padStart(2, '0')
}

function formatIcsDate(iso, time) {
  const [y, m, d] = iso.split('-').map(Number)
  if (time) {
    const [hh, mm] = time.split(':').map(Number)
    return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`
  }
  return `${y}${pad(m)}${pad(d)}`
}

function buildVEvent(e, tzid) {
  const date = e.status === 'picked' || e.status === 'confirmed' ? e.date : null
  if (!date) return null
  const uid = `${e.id}@property-launch-cal`
  const dtstart = formatIcsDate(date, e.time)
  const endIso = e.end_date || date
  const hasTime = Boolean(e.time)
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString().slice(0, 10))}`,
    hasTime ? `DTSTART;TZID=${tzid}:${dtstart}` : `DTSTART;VALUE=DATE:${dtstart.slice(0, 8)}`,
  ]
  if (hasTime && e.end_time) {
    lines.push(`DTEND;TZID=${tzid}:${formatIcsDate(endIso, e.end_time)}`)
  } else if (!hasTime && endIso !== date) {
    const end = parseISO(endIso)
    end.setDate(end.getDate() + 1)
    const y = end.getFullYear()
    const m = pad(end.getMonth() + 1)
    const d = pad(end.getDate())
    lines.push(`DTEND;VALUE=DATE:${y}${m}${d}`)
  } else if (hasTime) {
    const [hh, mm] = (e.time || '09:00').split(':').map(Number)
    const endH = hh + 1
    lines.push(`DTEND;TZID=${tzid}:${formatIcsDate(date, `${pad(endH)}:${pad(mm)}`)}`)
  }
  lines.push(`SUMMARY:${(e.title || '').replace(/\n/g, ' ')}`)
  if (e.description) {
    lines.push(`DESCRIPTION:${e.description.replace(/\n/g, '\\n')}`)
  }
  if (e.assigned_to) {
    lines.push(`ORGANIZER;CN=${e.assigned_to}:mailto:${e.assigned_email || 'noreply@local'}`)
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function eventToIcs(e, tzid) {
  const vevent = buildVEvent(e, tzid)
  if (!vevent) return null
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Property Launch Calendar//EN',
    'CALSCALE:GREGORIAN',
    vevent,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function eventsToIcs(events, tzid) {
  const vevents = events.map((e) => buildVEvent(e, tzid)).filter(Boolean)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Property Launch Calendar//EN',
    'CALSCALE:GREGORIAN',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(filename, ics) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slugify(s) {
  return (s || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}
