import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock } from 'lucide-react'
import {
  HOLIDAYS,
  MONTHS,
  DOW,
  buildMonthGrid,
  calendarEventShortName,
  eventsOnDate,
  formatLongDate,
  isoDate,
} from '@/lib/scheduleUtils'
import { getEventChipPresentation } from '@/lib/responsibilityColors'

function cellLabel(e) {
  const short = calendarEventShortName(e)
  const text = short.length > 22 ? `${short.slice(0, 20)}…` : short
  return e.completed ? `✓ ${text}` : text
}

function EventHoverTip({ tip }) {
  if (!tip) return null
  const { event, rect } = tip
  const style = {
    position: 'fixed',
    left: Math.min(rect.left, window.innerWidth - 280),
    top: rect.bottom + 6,
    zIndex: 60,
  }
  return createPortal(
    <div
      className="pointer-events-none max-w-[260px] border border-zinc-200 bg-white p-2.5 shadow-lg text-left"
      style={style}
      role="tooltip"
    >
      <p className="font-sans text-sm font-semibold text-zinc-950">{calendarEventShortName(event)}</p>
      {event.status === 'awaiting_pick' ? (
        <p className="font-body text-xs text-amber-800 mt-1">Client choosing between dates</p>
      ) : (
        event.date && (
          <p className="font-body text-xs text-zinc-600 mt-1">
            {formatLongDate(event.date)}
            {event.time ? ` · ${event.time}` : ''}
            {event.end_date && event.end_date !== event.date ? ` – ${formatLongDate(event.end_date)}` : ''}
          </p>
        )
      )}
      {event.description && (
        <p className="font-body text-xs text-zinc-500 mt-1 line-clamp-3">{event.description}</p>
      )}
    </div>,
    document.body,
  )
}

function EventChip({ event, isoForCell, drag, onScrollToEvent, showTip, hideTip, listingParties }) {
  const { style, awaiting } = getEventChipPresentation(event, listingParties)
  const isAdminOnly = event.visibility === 'admin_only'
  const draggable = Boolean(drag)
  const isPressed = draggable && drag.pressedId === event.id
  const isDragging = draggable && drag.draggingId === event.id
  const isGhostSource = isDragging

  const merged = {
    ...style,
    opacity: isGhostSource ? 0.2 : 1,
    ...(draggable
      ? {
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }
      : {}),
  }

  const chipClass = [
    'cal-event-chip font-cal-narrow truncate relative z-[1]',
    isPressed ? 'cal-chip-pressed' : '',
    isGhostSource ? 'cal-chip-dragging' : '',
    draggable && !isPressed && !isGhostSource ? 'hover:ring-1 hover:ring-zinc-400' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handlePointerDown = draggable
    ? (e) => {
        hideTip()
        e.stopPropagation()
        drag.startDrag(e, event, isoForCell)
      }
    : undefined

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    onScrollToEvent?.(event)
  }

  const handleMouseEnter = (e) => {
    if (draggable && (drag?.isDragging || drag?.pressedId)) return
    const rect = e.currentTarget.getBoundingClientRect()
    showTip({ event, rect })
  }

  return (
    <div
      className={chipClass}
      style={merged}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTip}
      onFocus={handleMouseEnter}
      onBlur={hideTip}
      title={isAdminOnly ? `${calendarEventShortName(event)} (admin-only)` : undefined}
    >
      {awaiting && <span className="cal-event-q">?</span>}
      {isAdminOnly && <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" aria-hidden />}
      {cellLabel(event)}
    </div>
  )
}

function DayCell({
  iso,
  inMonth,
  dayEvents,
  hasEvents,
  awaiting,
  onClick,
  onBlankClick,
  adminCreate,
  dragOver,
  children,
}) {
  const interactive = hasEvents && inMonth
  const canCreate = adminCreate && inMonth

  const baseClass = `cal-day-cell relative min-h-[76px] sm:min-h-[84px] print:min-h-[68px] p-1 text-left transition-colors ${
    inMonth ? 'bg-white' : 'bg-zinc-50/80'
  } ${inMonth && (hasEvents || canCreate) ? 'hover:bg-zinc-50 cursor-pointer print:hover:bg-white' : 'cursor-default'} ${
    awaiting ? 'ring-1 ring-inset ring-amber-200' : ''
  } ${dragOver ? 'bg-amber-50/80' : ''}`

  const handleClick = (e) => {
    if (e.target.closest('.cal-event-chip')) return
    if (canCreate) {
      onBlankClick?.(iso)
      return
    }
    if (interactive) onClick?.(iso, dayEvents)
  }
  const handleKeyDown = (e) => {
    if (!canCreate && !interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (canCreate) onBlankClick?.(iso)
      else if (interactive) onClick?.(iso, dayEvents)
    }
  }

  return (
    <div
      data-day-iso={iso}
      data-in-month={inMonth ? 'true' : 'false'}
      role={canCreate || interactive ? 'button' : undefined}
      tabIndex={canCreate || interactive ? 0 : -1}
      onClick={canCreate || interactive ? handleClick : undefined}
      onKeyDown={canCreate || interactive ? handleKeyDown : undefined}
      className={baseClass}
    >
      {children}
    </div>
  )
}

export default function MonthCalendar({
  year,
  month,
  events,
  onSelectDate,
  draggable = false,
  drag = null,
  onScrollToEvent,
  onCreateOnDate = null,
  adminCreate = false,
  listingParties = null,
}) {
  const cells = buildMonthGrid(year, month)
  const activeDrag = draggable ? drag : null
  const [hoverTip, setHoverTip] = useState(null)
  const showTip = (tip) => setHoverTip(tip)
  const hideTip = () => setHoverTip(null)

  return (
    <div className="month-calendar">
      <EventHoverTip tip={hoverTip} />
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
          const dayEvents = inMonth ? eventsOnDate(events, iso) : []
          const hasEvents = dayEvents.length > 0
          const awaiting = dayEvents.some((e) => e.status === 'awaiting_pick')
          const dragOver = Boolean(activeDrag?.overIso === iso && activeDrag?.isDragging)

          return (
            <DayCell
              key={`${year}-${month}-${iso}-${inMonth}`}
              iso={iso}
              inMonth={inMonth}
              dayEvents={dayEvents}
              hasEvents={hasEvents}
              awaiting={awaiting}
              onClick={onSelectDate}
              onBlankClick={onCreateOnDate}
              adminCreate={adminCreate}
              dragOver={dragOver}
            >
              <div className="cal-day-header">
                <span className={`cal-day-num ${inMonth ? 'text-zinc-950' : 'text-zinc-300'}`}>
                  {date.getDate()}
                </span>
                {holiday && <span className="cal-holiday">{holiday}</span>}
              </div>
              <div className="cal-day-events space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip
                    key={e.id}
                    event={e}
                    isoForCell={iso}
                    drag={activeDrag}
                    onScrollToEvent={onScrollToEvent}
                    showTip={showTip}
                    hideTip={hideTip}
                    listingParties={listingParties}
                  />
                ))}
              </div>
            </DayCell>
          )
        })}
      </div>
    </div>
  )
}
