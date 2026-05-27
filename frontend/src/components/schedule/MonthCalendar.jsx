import { Lock } from 'lucide-react'
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

function EventChip({ event, isoForCell, drag }) {
  const { style, awaiting } = getEventChipPresentation(event)
  const isAdminOnly = event.visibility === 'admin_only'
  const draggable = Boolean(drag)
  const isDragging = draggable && drag.draggingId === event.id

  const merged = {
    ...style,
    opacity: isDragging ? 0.4 : 1,
    ...(draggable
      ? { cursor: 'grab', touchAction: 'none', userSelect: 'none' }
      : {}),
  }

  const handlePointerDown = draggable
    ? (e) => drag.startDrag(e, event, isoForCell)
    : undefined

  return (
    <div
      className="cal-event-chip font-cal-narrow truncate"
      style={merged}
      title={isAdminOnly ? `${calendarEventShortName(event)} (admin-only)` : calendarEventShortName(event)}
      role={draggable ? 'button' : undefined}
      aria-roledescription={draggable ? 'draggable' : undefined}
      onPointerDown={handlePointerDown}
    >
      {awaiting && <span className="cal-event-q">?</span>}
      {isAdminOnly && <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" aria-hidden />}
      {cellLabel(event)}
    </div>
  )
}

function DayCell({ iso, inMonth, dayEvents, hasEvents, awaiting, onClick, draggable, drag, children }) {
  const interactive = hasEvents || draggable
  const isOver = draggable && drag?.overIso === iso

  const baseClass = `cal-day-cell relative min-h-[76px] sm:min-h-[84px] print:min-h-[68px] p-1 text-left transition-colors ${
    inMonth ? 'bg-white' : 'bg-zinc-50/80'
  } ${hasEvents ? 'hover:bg-zinc-50 cursor-pointer print:hover:bg-white' : 'cursor-default'} ${
    awaiting ? 'ring-1 ring-inset ring-amber-200' : ''
  } ${isOver ? 'ring-2 ring-inset ring-zinc-900 bg-zinc-50' : ''}`

  const handleClick = () => {
    if (hasEvents) onClick(iso, dayEvents)
  }
  const handleKeyDown = (e) => {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // <div role="button"> instead of <button> so we can place draggable chips
  // (also role="button") inside without the invalid HTML / pointer-event
  // interference that broke @dnd-kit.
  return (
    <div
      data-day-iso={iso}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : -1}
      aria-disabled={!interactive}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={baseClass}
    >
      {children}
    </div>
  )
}

export default function MonthCalendar({ year, month, events, onSelectDate, draggable = false, drag = null }) {
  const cells = buildMonthGrid(year, month)
  const activeDrag = draggable ? drag : null

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
            <DayCell
              key={iso + inMonth}
              iso={iso}
              inMonth={inMonth}
              dayEvents={dayEvents}
              hasEvents={hasEvents}
              awaiting={awaiting}
              onClick={onSelectDate}
              draggable={draggable}
              drag={activeDrag}
            >
              <div className="cal-day-header">
                <span className={`cal-day-num ${inMonth ? 'text-zinc-950' : 'text-zinc-300'}`}>
                  {date.getDate()}
                </span>
                {holiday && <span className="cal-holiday">{holiday}</span>}
              </div>
              <div className="cal-day-events space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} event={e} isoForCell={iso} drag={activeDrag} />
                ))}
              </div>
            </DayCell>
          )
        })}
      </div>
    </div>
  )
}
