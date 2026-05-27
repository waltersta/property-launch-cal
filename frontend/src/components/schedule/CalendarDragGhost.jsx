import { createPortal } from 'react-dom'
import { calendarEventShortName } from '@/lib/scheduleUtils'

/**
 * Floating chip that follows the pointer while dragging.
 */
export default function CalendarDragGhost({ ghost }) {
  if (!ghost) return null

  const { event, x, y, width, height, style, spanDays } = ghost
  const label = calendarEventShortName(event)

  return createPortal(
    <div
      className="cal-drag-ghost cal-event-chip font-cal-narrow pointer-events-none"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width,
        minHeight: height,
        zIndex: 200,
        ...style,
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      }}
      aria-hidden
    >
      <span className="truncate block pr-6">{label}</span>
      {spanDays > 1 && (
        <span className="cal-drag-ghost-span absolute right-1 top-1/2 -translate-y-1/2 text-[0.55rem] font-bold uppercase tracking-wide opacity-80">
          {spanDays}d
        </span>
      )}
    </div>,
    document.body,
  )
}
