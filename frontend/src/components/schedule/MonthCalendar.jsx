import {
  HOLIDAYS,
  MONTHS,
  DOW,
  buildMonthGrid,
  calendarEventShortName,
  eventsOnDate,
  isoDate,
} from '@/lib/scheduleUtils'
import { getEventChipPresentation } from '@/lib/responsibilityColors'

function cellLabel(e) {
  const short = calendarEventShortName(e)
  return short.length > 22 ? `${short.slice(0, 20)}…` : short
}

function EventChip({ event }) {
  const { style, awaiting } = getEventChipPresentation(event)
  const label = cellLabel(event)

  return (
    <div
      className="cal-event-chip font-cal-narrow truncate"
      style={style}
      title={calendarEventShortName(event)}
    >
      {awaiting && <span className="cal-event-q">?</span>}
      {label}
    </div>
  )
}

export default function MonthCalendar({ year, month, events, onSelectDate }) {
  const cells = buildMonthGrid(year, month)

  return (
    <div className="month-calendar">
      <h3 className="font-sans text-xl font-medium tracking-tight mb-3 print:text-lg">
        {MONTHS[month]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 print:text-[10px]">
        {DOW.map((d) => (
          <div
            key={d}
            className="bg-zinc-50 px-1 py-1.5 text-center text-[0.6rem] font-semibold uppercase tracking-widest text-zinc-500 print:py-1"
          >
            {d}
          </div>
        ))}
        {cells.map(({ date, inMonth }) => {
          const iso = isoDate(date)
          const holiday = inMonth ? HOLIDAYS[iso] : null
          const dayEvents = eventsOnDate(events, iso)
          const hasEvents = dayEvents.length > 0
          const awaiting = dayEvents.some((e) => e.status === 'awaiting_pick')

          return (
            <button
              key={iso + inMonth}
              type="button"
              disabled={!hasEvents}
              onClick={() => hasEvents && onSelectDate(iso, dayEvents)}
              className={`cal-day-cell relative min-h-[76px] sm:min-h-[84px] print:min-h-[68px] p-1 text-left transition-colors ${
                inMonth ? 'bg-white' : 'bg-zinc-50/80'
              } ${hasEvents ? 'hover:bg-zinc-50 cursor-pointer print:hover:bg-white' : 'cursor-default'} ${awaiting ? 'ring-1 ring-inset ring-amber-200' : ''}`}
            >
              <div className="cal-day-header">
                <span
                  className={`cal-day-num ${inMonth ? 'text-zinc-950' : 'text-zinc-300'}`}
                >
                  {date.getDate()}
                </span>
                {holiday && <span className="cal-holiday">{holiday}</span>}
              </div>
              <div className="cal-day-events space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} event={e} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
