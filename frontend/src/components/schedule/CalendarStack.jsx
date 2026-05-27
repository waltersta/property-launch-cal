import { collectPartiesFromEvents } from '@/lib/responsibilityColors'
import { eventsInCalendarMonth } from '@/lib/scheduleUtils'
import MonthCalendar from '@/components/schedule/MonthCalendar'
import CalendarDragGhost from '@/components/schedule/CalendarDragGhost'
import ResponsibilityLegend from '@/components/schedule/ResponsibilityLegend'

export default function CalendarStack({
  months,
  events,
  onSelectDate,
  draggable = false,
  drag = null,
  onScrollToEvent,
  onCreateOnDate = null,
  adminCreate = false,
  listingParties = null,
}) {
  return (
    <div className="calendar-print-stack max-w-[8.5in] mx-auto">
      <CalendarDragGhost ghost={drag?.ghost} />
      <div className="flex flex-col gap-10 print:gap-8">
        {months.map(({ year, month }) => {
          const monthEvents = eventsInCalendarMonth(events, year, month)
          const parties = collectPartiesFromEvents(monthEvents, listingParties)

          return (
            <div key={`${year}-${month}`} className="month-calendar-block">
              <MonthCalendar
                year={year}
                month={month}
                events={events}
                onSelectDate={onSelectDate}
                draggable={draggable}
                drag={drag}
                onScrollToEvent={onScrollToEvent}
                onCreateOnDate={onCreateOnDate}
                adminCreate={adminCreate}
                listingParties={listingParties}
              />
              <ResponsibilityLegend parties={parties} listingParties={listingParties} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
