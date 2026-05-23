import { collectPartiesFromEvents } from '@/lib/responsibilityColors'
import { eventsInCalendarMonth } from '@/lib/scheduleUtils'
import MonthCalendar from '@/components/schedule/MonthCalendar'
import ResponsibilityLegend from '@/components/schedule/ResponsibilityLegend'

export default function CalendarStack({ months, events, onSelectDate }) {
  return (
    <div className="calendar-print-stack max-w-[8.5in] mx-auto">
      <div className="flex flex-col gap-10 print:gap-8">
        {months.map(({ year, month }) => {
          const monthEvents = eventsInCalendarMonth(events, year, month)
          const parties = collectPartiesFromEvents(monthEvents)

          return (
            <div key={`${year}-${month}`} className="month-calendar-block">
              <MonthCalendar
                year={year}
                month={month}
                events={events}
                onSelectDate={onSelectDate}
              />
              <ResponsibilityLegend parties={parties} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
