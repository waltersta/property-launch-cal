import { Calendar, Pencil, Trash2, Lock } from 'lucide-react'
import api, { effectiveSortDate } from '@/lib/scheduleApi'
import { displayPickOwner } from '@/lib/responsibilityColors'
import { formatLongDate, parseISO, timelineEventTitle } from '@/lib/scheduleUtils'
import { eventToIcs, downloadIcs, slugify } from '@/lib/ics'
import { buildPickUrl } from '@/lib/shareUrls'
import { timelineIconForEvent } from '@/lib/timelineIcons'
import { Button } from '@/components/ui/button'

function dateColumn(e) {
  if (e.status === 'awaiting_pick') {
    return { top: 'TBD', sub: `${(e.date_options || []).length} OPTIONS` }
  }
  const d = parseISO(e.date)
  if (!d) return { top: '—', sub: '' }
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return {
    top: String(d.getDate()),
    mid: months[d.getMonth()],
    sub: String(d.getFullYear()),
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
  }
}

export default function Timeline({
  events,
  listingParties,
  isAdmin,
  isShare,
  tzid,
  propertySlug,
  onEdit,
  onDelete,
  onToggleComplete,
  onPickRequested,
  onChanged,
}) {
  const sorted = [...events].sort((a, b) => effectiveSortDate(a).localeCompare(effectiveSortDate(b)))

  if (sorted.length === 0) {
    return (
      <div className="border border-dashed border-zinc-300 p-12 text-center text-zinc-500 font-body">
        No events scheduled yet.
      </div>
    )
  }

  const handleAddToCal = (e) => {
    const ics = eventToIcs(e, tzid)
    if (!ics) return
    downloadIcs(slugify(e.title), ics)
  }

  return (
    <ol className="timeline space-y-8 pt-2" data-testid="timeline">
      {sorted.map((e) => {
        const Icon = timelineIconForEvent(e)
        const pending = e.status === 'awaiting_pick'
        const col = dateColumn(e)
        const pillClass =
          e.status === 'confirmed' ? 'confirmed' : e.status === 'picked' ? 'picked' : 'awaiting_pick'
        const pillLabel =
          e.status === 'confirmed'
            ? 'Confirmed'
            : e.status === 'picked'
              ? 'Confirmed'
              : 'Awaiting preference'
        const showAddToCal = !pending && e.date

        return (
          <li
            key={e.id}
            id={`event-${e.id}`}
            className="grid grid-cols-[68px_1fr] sm:grid-cols-[140px_1fr] gap-x-4 sm:gap-x-8 items-start scroll-mt-24 transition-colors duration-700"
            data-testid={`timeline-item-${e.id}`}
          >
            <div className="pt-1 text-right">
              {pending ? (
                <>
                  <div className="font-display text-sm sm:text-base font-medium text-zinc-950 leading-tight">
                    {col.top}
                  </div>
                  <div className="overline text-zinc-400 mt-1 hidden sm:block">{col.sub}</div>
                </>
              ) : (
                <>
                  <div className="overline text-zinc-400 hidden sm:block">{col.dow}</div>
                  <div className="font-display text-3xl sm:text-4xl font-light leading-none text-zinc-950">
                    {col.top}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-500 uppercase">
                    {col.mid} {col.sub}
                  </div>
                </>
              )}
            </div>

            <div className="border border-zinc-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                  <span className={`pill ${pillClass}`}>{pillLabel}</span>
                  {e.visibility === 'admin_only' && (
                    <span
                      className="inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-widest border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-zinc-600"
                      title="Admin-only event — hidden from client share"
                    >
                      <Lock className="h-3 w-3" />
                      Admin only
                    </span>
                  )}
                  {e.time && (
                    <span className="text-sm font-medium text-zinc-700">{e.time}</span>
                  )}
                  {e.end_date && e.end_date !== e.date && (
                    <span className="text-sm text-zinc-500">through {formatLongDate(e.end_date).replace(/, \d{4}$/, '')}</span>
                  )}
                </div>
                <div className="flex gap-1 items-center shrink-0 ml-auto">
                  {showAddToCal && (
                    <span className="relative inline-flex group/add-cal">
                      <button
                        type="button"
                        onClick={() => handleAddToCal(e)}
                        title="Add to calendar"
                        className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 rounded-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
                        data-testid={`add-to-calendar-${e.id}`}
                        aria-label="Add to calendar"
                        aria-describedby={`add-to-calendar-tip-${e.id}`}
                      >
                        <Calendar className="h-4 w-4" aria-hidden />
                      </button>
                      <span
                        id={`add-to-calendar-tip-${e.id}`}
                        role="tooltip"
                        className="pointer-events-none absolute right-0 top-full z-30 mt-1 whitespace-nowrap border border-zinc-200 bg-white px-2 py-1 text-[0.65rem] font-body text-zinc-700 shadow-md opacity-0 transition-opacity duration-150 group-hover/add-cal:opacity-100 group-focus-within/add-cal:opacity-100"
                      >
                        Add to calendar
                      </span>
                    </span>
                  )}
                  {isAdmin && (
                    <>
                      <label className="flex items-center gap-1.5 text-xs text-zinc-600 font-body cursor-pointer px-1">
                        <input
                          type="checkbox"
                          checked={Boolean(e.completed)}
                          onChange={() => onToggleComplete?.(e)}
                          aria-label="Mark completed"
                        />
                        Done
                      </label>
                      <Button variant="ghost" size="sm" className="rounded-none h-8 px-2" onClick={() => onEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none h-8 px-2 text-red-600 hover:text-red-700"
                        onClick={() => onDelete(e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 mb-2">
                <Icon className="h-5 w-5 text-zinc-400 mt-0.5 shrink-0" />
                <h4 className="font-sans text-xl sm:text-2xl font-medium tracking-tight text-zinc-950">
                  {e.completed && (
                    <span className="text-emerald-700 mr-1" aria-hidden>
                      ✓
                    </span>
                  )}
                  {timelineEventTitle(e)}
                </h4>
              </div>
              {(e.description || pending) && (
                <p className="font-body text-zinc-600 text-sm sm:text-base mb-4 ml-8">
                  {pending && (
                    <span className="font-display font-semibold text-amber-700 mr-1" title="Awaiting preference">
                      ?
                    </span>
                  )}
                  {e.description}
                </p>
              )}

              {(e.assigned_to || (pending && e.pick_owner)) && (
                <div className="ml-8 mb-4 text-sm font-body flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="overline text-zinc-400 shrink-0">With</span>
                  {pending && e.pick_owner && (
                    <>
                      <span className="font-medium text-zinc-950">{displayPickOwner(e.pick_owner, listingParties)}</span>
                      {e.assigned_to && e.assigned_to !== e.pick_owner && (
                        <span className="text-zinc-400" aria-hidden>
                          ·
                        </span>
                      )}
                    </>
                  )}
                  {e.assigned_to && (
                    <>
                      <span className="font-medium text-zinc-950">{e.assigned_to}</span>
                      {e.assigned_phone && (
                        <>
                          <span className="text-zinc-300 hidden sm:inline" aria-hidden>
                            ·
                          </span>
                          <a
                            href={`tel:${e.assigned_phone}`}
                            className="text-zinc-600 hover:text-zinc-950 whitespace-nowrap"
                          >
                            {e.assigned_phone}
                          </a>
                        </>
                      )}
                      {e.assigned_email && (
                        <>
                          <span className="text-zinc-300 hidden sm:inline" aria-hidden>
                            ·
                          </span>
                          <a
                            href={`mailto:${e.assigned_email}`}
                            className="text-zinc-600 hover:text-zinc-950 break-all sm:break-normal"
                          >
                            {e.assigned_email}
                          </a>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {pending && (e.date_options || []).length > 0 && (
                <div className="ml-8 flex flex-wrap gap-2 mb-4">
                  {e.date_options.map((d) => (
                    <span key={d} className="text-xs border border-zinc-200 px-2 py-1 text-zinc-600">
                      {formatLongDate(d).replace(/, \d{4}$/, '')}
                    </span>
                  ))}
                </div>
              )}

              {pending && (isShare || isAdmin) ? (
                <div className="ml-8 flex flex-wrap gap-3">
                  <Button
                    className="rounded-none uppercase tracking-widest text-xs"
                    onClick={() => onPickRequested(e)}
                  >
                    {isAdmin && !isShare ? 'Confirm date' : 'Pick a date'}
                  </Button>
                  {isAdmin && !isShare && pending && (
                    <Button
                      variant="outline"
                      className="rounded-none text-xs"
                      onClick={async () => {
                        const { pick_token } = await api.generatePickToken(e.id)
                        const url = buildPickUrl(window.location.origin, pick_token, propertySlug)
                        await navigator.clipboard.writeText(url)
                        onChanged?.()
                      }}
                    >
                      Copy pick link
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
