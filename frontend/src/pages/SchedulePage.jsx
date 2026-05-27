import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Link2, Plus, RotateCcw } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import api, { ADMIN_KEY, effectiveSortDate } from '@/lib/scheduleApi'
import { eventsToIcs, downloadIcs, slugify } from '@/lib/ics'
import { displayPickOwner } from '@/lib/responsibilityColors'
import { agentDisplayName, clientNamesLabel, normalizeListingParties } from '@/lib/listingParties'
import { useCalendarDrag } from '@/lib/useCalendarDrag'
import {
  eventDisplayName,
  formatDateTime,
  formatLongDate,
  rescheduleDatesForDrop,
  scheduleLastModified,
  sharpImageUrl,
} from '@/lib/scheduleUtils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import CalendarStack from '@/components/schedule/CalendarStack'
import Timeline from '@/components/schedule/Timeline'
import EventDialog from '@/components/schedule/EventDialog'
import PickDateDialog from '@/components/schedule/PickDateDialog'
import AdminUnlockDialog from '@/components/schedule/AdminUnlockDialog'
import ClientShareUnlockDialog from '@/components/schedule/ClientShareUnlockDialog'
import CreateListingDialog from '@/components/schedule/CreateListingDialog'
import ListingAdminPanel from '@/components/schedule/ListingAdminPanel'
import NotesSection from '@/components/schedule/NotesSection'
import PickNotifications from '@/components/schedule/PickNotifications'
import { getClientToken } from '@/lib/clientAuth'
import { buildScheduleShareUrl } from '@/lib/shareUrls'

export default function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isShare = searchParams.get('view') === 'share'
  const propertyParam = searchParams.get('property')

  const [config, setConfig] = useState(null)
  const [events, setEvents] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientReady, setClientReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => Boolean(localStorage.getItem(ADMIN_KEY)))
  const [adminMode, setAdminMode] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [pickEvent, setPickEvent] = useState(null)
  const [pickOpen, setPickOpen] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [createListingOpen, setCreateListingOpen] = useState(false)
  const [headerImgFailed, setHeaderImgFailed] = useState(false)

  const loadListingData = useCallback(async (slug) => {
    const [evs, nts] = await Promise.all([api.list(slug), api.listNotes(slug)])
    setEvents(evs)
    setNotes(nts)
  }, [])

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const cfg = await api.getConfig(propertyParam || undefined)
      setConfig(cfg)
      const slug = cfg.property_slug
      const needsClient = isShare && cfg.client_auth_required
      const hasClient = Boolean(getClientToken(slug))
      if (needsClient && !hasClient) {
        setClientReady(false)
        setEvents([])
        setNotes([])
        return
      }
      setClientReady(true)
      await loadListingData(slug)
    } catch (err) {
      if (err.response?.status === 404) {
        setLoadError('not_found')
      } else if (err.response?.status === 401) {
        setClientReady(false)
      } else {
        toast.error('Could not load schedule')
      }
    } finally {
      setLoading(false)
    }
  }, [propertyParam, isShare, loadListingData])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!config?.property_slug || loadError) return
    if (isShare && propertyParam !== config.property_slug) {
      const next = new URLSearchParams(searchParams)
      next.set('property', config.property_slug)
      setSearchParams(next, { replace: true })
    }
  }, [config, isShare, propertyParam, loadError, searchParams, setSearchParams])

  useEffect(() => {
    if (config?.property_name) {
      document.title = `${config.property_name} · Listing Schedule`
    }
  }, [config?.property_name])

  useEffect(() => {
    setHeaderImgFailed(false)
  }, [config?.property_slug, config?.header_image_url])

  useEffect(() => {
    if (adminMode && !isAdmin) {
      setUnlockOpen(true)
    }
  }, [adminMode, isAdmin])

  const tzid = config?.tzid || 'America/Los_Angeles'

  const stats = useMemo(() => {
    const confirmed = events.filter((e) => e.status === 'confirmed' || e.status === 'picked').length
    const awaiting = events.filter((e) => e.status === 'awaiting_pick').length
    return { total: events.length, confirmed, awaiting }
  }, [events])

  const nextEvent = useMemo(() => {
    const upcoming = [...events]
      .filter((e) => e.status !== 'awaiting_pick' && e.date)
      .sort((a, b) => effectiveSortDate(a).localeCompare(effectiveSortDate(b)))
    const today = new Date().toISOString().slice(0, 10)
    return upcoming.find((e) => e.date >= today) || upcoming[0]
  }, [events])

  const calendarMonths = useMemo(() => {
    if (!config) return []
    const year = config.calendar_year || 2026
    const start = config.calendar_month_start ?? 4
    const end = config.calendar_month_end ?? 5
    const months = []
    for (let m = start; m <= end; m++) {
      months.push({ year, month: m })
    }
    return months
  }, [config])

  const lastModifiedAt = useMemo(
    () => scheduleLastModified(events, notes),
    [events, notes],
  )

  const listingParties = useMemo(
    () => normalizeListingParties(config?.listing_parties),
    [config?.listing_parties],
  )

  const handleAdminSuccess = (token) => {
    localStorage.setItem(ADMIN_KEY, token)
    setIsAdmin(true)
    setUnlockOpen(false)
    toast.success('Admin unlocked')
  }

  const handleAdminToggle = (on) => {
    if (on && !isAdmin) {
      setUnlockOpen(true)
      setAdminMode(true)
      return
    }
    setAdminMode(on)
    if (!on) setUnlockOpen(false)
  }

  const handleCopyShareLink = async () => {
    const url = buildScheduleShareUrl(window.location.origin, config?.property_slug)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Client share link copied')
    } catch {
      window.prompt('Copy this share link:', url)
    }
  }

  const handleExportAll = () => {
    if (events.length === 0) return
    const ics = eventsToIcs(events, tzid)
    const name = slugify(config?.property_name || 'schedule')
    downloadIcs(`${name}-schedule`, ics)
    toast.success('Schedule downloaded (.ics)')
  }

  const scrollToEvent = useCallback((event) => {
    if (!event?.id) return
    const el = document.getElementById(`event-${event.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.remove('timeline-flash')
      void el.offsetWidth
      el.classList.add('timeline-flash')
    }
  }, [])

  const handleSelectDate = (iso, dayEvents) => {
    if (!dayEvents?.length) return
    scrollToEvent(dayEvents[0])
  }

  const handleSaveEvent = async (payload) => {
    try {
      if (editingEvent) {
        await api.update(editingEvent.id, payload)
        toast.success('Event updated')
      } else {
        await api.create(config.property_slug, payload)
        toast.success('Event created')
      }
      setEventDialogOpen(false)
      setEditingEvent(null)
      load()
    } catch {
      toast.error('Could not save event')
    }
  }

  const handleDelete = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}"?`)) return
    try {
      await api.remove(ev.id)
      toast.success('Event deleted')
      load()
    } catch {
      toast.error('Could not delete event')
    }
  }

  const handlePick = async (data) => {
    if (!pickEvent) return
    try {
      await api.pick(pickEvent.id, data)
      toast.success('Date confirmed — thank you!')
      setPickOpen(false)
      setPickEvent(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not submit pick')
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all events to demo data?')) return
    try {
      await api.reset(config?.property_slug)
      toast.success('Schedule reset to demo')
      load()
    } catch {
      toast.error('Could not reset')
    }
  }

  const handleDrop = useCallback(
    async (ev, targetIso) => {
      if (!ev || !targetIso) return
      if (ev.status === 'awaiting_pick') {
        toast.info('Confirm a pick before moving this event.')
        return
      }
      if (ev.date === targetIso) return
      const dates = rescheduleDatesForDrop(ev, targetIso)
      if (!dates) return

      const snapshot = events
      setEvents((prev) =>
        prev.map((e) =>
          e.id === ev.id
            ? { ...e, ...dates, updated_at: new Date().toISOString() }
            : e,
        ),
      )
      try {
        const updated = await api.update(ev.id, dates)
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
        toast.success('Event moved')
      } catch {
        setEvents(snapshot)
        toast.error('Could not move event')
      }
    },
    [events],
  )

  const canDragCalendar = isAdmin && adminMode && !isShare
  const calendarDrag = useCalendarDrag({ enabled: canDragCalendar, onDrop: handleDrop })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body text-zinc-500">
        Loading schedule…
      </div>
    )
  }

  if (config && isShare && config.client_auth_required && !clientReady) {
    return (
      <ClientShareUnlockDialog
        propertySlug={config.property_slug}
        propertyName={config.property_name}
        onSuccess={async () => {
          setLoading(true)
          setClientReady(true)
          try {
            await loadListingData(config.property_slug)
          } catch {
            toast.error('Could not load schedule')
          } finally {
            setLoading(false)
          }
        }}
      />
    )
  }

  if (loadError === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center font-body text-zinc-600">
        <h1 className="font-display text-2xl font-light text-zinc-950 mb-2">Schedule not found</h1>
        <p className="text-sm max-w-md">
          No listing schedule exists for <span className="font-mono text-zinc-800">{propertyParam}</span>.
          Check the link you received or contact your agent.
        </p>
      </div>
    )
  }

  const propertyName = config?.property_name || 'Property'
  const canExport = isShare || isAdmin
  const awaitingPickEvent = events.find((e) => e.status === 'awaiting_pick')

  return (
    <div className="min-h-screen bg-white" id="top">
      <Toaster position="top-center" />

      {config?.header_image_url && !headerImgFailed && (
        <div className="branded-header border-b border-zinc-200" data-testid="branded-header">
          <img
            src={sharpImageUrl(config.header_image_url, 2048)}
            alt={propertyName}
            className="branded-header-img"
            width={1024}
            height={76}
            decoding="sync"
            onError={() => setHeaderImgFailed(true)}
            data-testid="branded-header-img"
          />
        </div>
      )}

      <header
        className="relative min-h-[280px] sm:min-h-[360px] flex items-end hero-bg"
        style={{
          backgroundImage: config?.hero_image_url
            ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url("${sharpImageUrl(config.hero_image_url)}")`
            : 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5))',
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 pb-10 sm:pb-14 pt-24">
          <p className="overline text-white/70 mb-3">
            Listing schedule · {config?.calendar_year || new Date().getFullYear()}
            {!isShare && adminMode && isAdmin && (
              <span className="ml-3 border border-white/30 px-2 py-0.5">Admin</span>
            )}
          </p>
          <h1 className="font-property-title text-3xl sm:text-4xl text-white tracking-tight leading-tight">
            {propertyName}
          </h1>
          <p className="font-body text-white/90 mt-4 text-lg">
            {config?.tagline || 'New Listing'}
            {config?.launch_date_label && (
              <span> · Going live {config.launch_date_label}</span>
            )}
          </p>
          {nextEvent && (
            <p className="font-body text-white/80 mt-3 text-sm sm:text-base">
              <span className="font-medium text-white">Next:</span> {nextEvent.title}
              {nextEvent.date && (
                <span>
                  {' '}
                  · {formatLongDate(nextEvent.date)}
                  {nextEvent.time && ` at ${nextEvent.time}`}
                </span>
              )}
            </p>
          )}
          <p className="font-body text-white/70 mt-2 text-sm">
            {stats.total} events · {stats.confirmed} confirmed
            {stats.awaiting > 0 && <> · {stats.awaiting} awaiting preference</>}
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {!isShare && (
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-600">
                <Switch checked={adminMode} onCheckedChange={handleAdminToggle} />
                Admin
              </label>
            )}
            {isAdmin && adminMode && !isShare && (
              <>
                <Button variant="outline" className="rounded-none text-xs uppercase tracking-widest" onClick={() => { setEditingEvent(null); setEventDialogOpen(true) }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add event
                </Button>
                <Button variant="outline" className="rounded-none text-xs" onClick={handleCopyShareLink}>
                  <Link2 className="h-4 w-4 mr-1" />
                  Share link
                </Button>
                <Button variant="outline" className="rounded-none text-xs" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset demo
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none text-xs uppercase tracking-widest"
                  onClick={() => setCreateListingOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New listing
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            className="rounded-none text-xs uppercase tracking-widest"
            onClick={handleExportAll}
            disabled={!canExport || events.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export .ics
          </Button>
        </div>
      </div>

      <PickNotifications enabled={isAdmin && adminMode && !isShare} onPickReceived={load} />

      {isAdmin && adminMode && !isShare && config && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 pt-4 pb-2">
          <ListingAdminPanel
            propertySlug={config.property_slug}
            propertyName={config.property_name}
            listingParties={listingParties}
            onPartiesSaved={load}
          />
        </section>
      )}

      <CreateListingDialog
        open={createListingOpen}
        onOpenChange={setCreateListingOpen}
        onCreated={(row) => {
          const next = new URLSearchParams(searchParams)
          next.delete('view')
          next.set('property', row.property_slug)
          setSearchParams(next, { replace: true })
          setAdminMode(true)
        }}
      />

      {isShare && awaitingPickEvent && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-sm text-amber-950">
              <strong>{displayPickOwner(awaitingPickEvent.pick_owner, listingParties)}:</strong> please choose your preferred date for{' '}
              <strong>{eventDisplayName(awaitingPickEvent)}</strong> ({(awaitingPickEvent.date_options || []).length} options).
            </p>
            <Button
              className="rounded-none text-xs uppercase tracking-widest shrink-0"
              onClick={() => {
                setPickEvent(awaitingPickEvent)
                setPickOpen(true)
              }}
            >
              Pick a date
            </Button>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 print-calendar-section">
        {lastModifiedAt && (
          <div className="border border-zinc-300 bg-zinc-50 px-4 py-3 mb-4 print:border-zinc-400 text-center">
            <p className="as-of-stamp font-bold text-zinc-950">
              As of {formatDateTime(lastModifiedAt)}
            </p>
          </div>
        )}
        <p className="section-subhead text-zinc-400 mb-2">01 — Calendar</p>
        <h2 className="section-heading mb-2">
          {calendarMonths.length >= 2
            ? `${calendarMonths[0] && new Date(calendarMonths[0].year, calendarMonths[0].month).toLocaleString('en-US', { month: 'long' })} & ${calendarMonths[calendarMonths.length - 1] && new Date(calendarMonths[calendarMonths.length - 1].year, calendarMonths[calendarMonths.length - 1].month).toLocaleString('en-US', { month: 'long' })} ${calendarMonths[0]?.year}`
            : 'Schedule'}
        </h2>
        <p className="font-body text-zinc-500 mb-6 text-sm">
          Click any dated cell to jump to the event in the timeline.
        </p>

        <p className="font-body text-zinc-500 mb-6 text-sm print:hidden">
          Colors show who must be on site (legend under each month). Split = {agentDisplayName(listingParties)} and{' '}
          {clientNamesLabel(listingParties)} for key handover. ? = client still choosing a date.
        </p>

        {canDragCalendar && (
          <p className="font-body text-zinc-500 mb-4 text-xs print:hidden">
            Hover an event for details. Double-click to jump to the timeline. Drag a chip to another day
            to move it (long-press on touch).
          </p>
        )}

        <CalendarStack
          months={calendarMonths}
          events={events}
          onSelectDate={handleSelectDate}
          draggable={canDragCalendar}
          drag={calendarDrag}
          onScrollToEvent={scrollToEvent}
          listingParties={listingParties}
        />
      </section>

      <NotesSection
        notes={notes}
        isAdmin={isAdmin && adminMode && !isShare}
        onSave={async (payload, existing) => {
          if (existing) {
            await api.updateNote(existing.id, payload)
            toast.success('Note updated')
          } else {
            await api.createNote(config.property_slug, payload)
            toast.success('Note added')
          }
          await loadListingData(config.property_slug)
        }}
        onDelete={async (note) => {
          if (!window.confirm('Delete this note?')) return
          await api.deleteNote(note.id)
          toast.success('Note deleted')
          await loadListingData(config.property_slug)
        }}
      />

      <section className="max-w-7xl mx-auto px-6 sm:px-10 pb-20 sm:pb-28">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="section-subhead text-zinc-400 mb-2">03 — Timeline</p>
            <h2 className="section-heading">Prepare for market</h2>
          </div>
          <a href="#top" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-950">
            Back to top
          </a>
        </div>

        <Timeline
          events={events}
          listingParties={listingParties}
          isAdmin={isAdmin && adminMode && !isShare}
          isShare={isShare}
          tzid={tzid}
          propertySlug={config?.property_slug}
          onEdit={(e) => { setEditingEvent(e); setEventDialogOpen(true) }}
          onDelete={handleDelete}
          onPickRequested={(e) => { setPickEvent(e); setPickOpen(true) }}
          onChanged={load}
        />
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 font-body">
        <p>
          {propertyName} · Listing schedule · {config?.calendar_year || ''}
        </p>
        <p className="mt-1 text-xs">
          {isShare
            ? 'Shared client view — pick your date when prompted.'
            : 'Toggle Admin → copy client links under “Send to client”. You are notified when a date is picked.'}
        </p>
      </footer>

      <AdminUnlockDialog
        open={unlockOpen}
        onOpenChange={(open) => {
          setUnlockOpen(open)
          if (!open && !isAdmin) setAdminMode(false)
        }}
        onSuccess={handleAdminSuccess}
      />

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        initial={editingEvent}
        onSubmit={handleSaveEvent}
      />

      <PickDateDialog
        open={pickOpen}
        onOpenChange={setPickOpen}
        event={pickEvent}
        onSubmit={handlePick}
      />

    </div>
  )
}
