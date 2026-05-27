import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { CATEGORIES } from '@/lib/scheduleApi'
import { defaultPartiesForEvent, partyChoices } from '@/lib/eventParties'
import { categoryForTitle, EVENT_TITLE_OPTIONS, normalizeEventTitle } from '@/lib/eventTitles'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const empty = {
  title: '',
  description: '',
  category: 'general',
  date: '',
  end_date: '',
  time: '',
  end_time: '',
  assigned_to: '',
  assigned_phone: '',
  assigned_email: '',
  pick_owner: '',
  date_options: [],
  required_parties: [],
  visibility: 'public',
  completed: false,
}

export default function EventDialog({
  open,
  onOpenChange,
  initial,
  defaultDate = null,
  listingParties = null,
  onSubmit,
}) {
  const [form, setForm] = useState(empty)
  const [optionInput, setOptionInput] = useState('')
  const [requestPick, setRequestPick] = useState(false)

  const choices = partyChoices(listingParties)

  useEffect(() => {
    if (open) {
      if (initial) {
        const title = normalizeEventTitle(initial.title)
        setForm({
          ...empty,
          ...initial,
          title,
          category: initial.category || categoryForTitle(title),
          date_options: initial.date_options || [],
          required_parties: defaultPartiesForEvent(initial, listingParties),
          completed: Boolean(initial.completed),
        })
        setRequestPick(initial.status === 'awaiting_pick')
      } else {
        setForm({
          ...empty,
          date: defaultDate || '',
          required_parties: defaultPartiesForEvent({ category: 'general' }, listingParties),
        })
        setRequestPick(false)
      }
      setOptionInput('')
    }
  }, [open, initial, defaultDate, listingParties])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const setTitle = (title) => {
    setForm((f) => ({
      ...f,
      title,
      category: categoryForTitle(title),
      required_parties:
        title === 'Key handover'
          ? partyChoices(listingParties)
          : f.required_parties?.length
            ? f.required_parties
            : defaultPartiesForEvent({ category: categoryForTitle(title) }, listingParties),
    }))
  }

  const toggleParty = (name) => {
    setForm((f) => {
      const set = new Set(f.required_parties || [])
      if (set.has(name)) set.delete(name)
      else set.add(name)
      return { ...f, required_parties: [...set] }
    })
  }

  const addOption = () => {
    if (!optionInput || form.date_options.includes(optionInput)) return
    update('date_options', [...form.date_options, optionInput].sort())
    setOptionInput('')
  }

  const removeOption = (d) => update('date_options', form.date_options.filter((x) => x !== d))

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      title: form.title.trim(),
      description: form.description || '',
      category: form.category,
      assigned_to: form.assigned_to || '',
      assigned_phone: form.assigned_phone || '',
      assigned_email: form.assigned_email || '',
      pick_owner: form.pick_owner || '',
      required_parties: form.required_parties || [],
      completed: Boolean(form.completed),
      time: form.time || null,
      end_time: form.end_time || null,
      visibility: form.visibility === 'admin_only' ? 'admin_only' : 'public',
    }
    if (requestPick) {
      payload.status = 'awaiting_pick'
      payload.date = null
      payload.end_date = null
      payload.date_options = form.date_options
      payload.completed = false
    } else {
      payload.status = initial?.status === 'picked' ? 'picked' : 'confirmed'
      payload.date = form.date || null
      payload.end_date = form.end_date || null
      payload.date_options = []
    }
    if (!payload.title) return
    if (requestPick && payload.date_options.length < 2) {
      alert('Add at least 2 date options for a client pick')
      return
    }
    if (!requestPick && !payload.date) {
      alert('Please choose a date')
      return
    }
    if (!payload.required_parties?.length) {
      alert('Select at least one party who must be on site')
      return
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-zinc-300 sm:max-w-xl max-h-[90vh] overflow-y-auto" data-testid="event-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">
            {initial ? 'Edit Event' : 'New Event'}
          </DialogTitle>
          <DialogDescription className="font-body">
            Add a milestone to the listing schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="event-title-select">Event</Label>
            <select
              id="event-title-select"
              value={form.title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full h-10 border border-zinc-300 px-2 text-sm"
              required
            >
              <option value="" disabled>
                Select event…
              </option>
              {form.title && !EVENT_TITLE_OPTIONS.some((o) => o.title === form.title) && (
                <option value={form.title}>{form.title}</option>
              )}
              {EVENT_TITLE_OPTIONS.map((o) => (
                <option key={o.title} value={o.title}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="mt-1 w-full min-h-[80px] border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="mt-1 w-full h-10 border border-zinc-300 px-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestPick}
                  onChange={(e) => setRequestPick(e.target.checked)}
                />
                Request client to pick date
              </label>
            </div>
          </div>
          {!requestPick ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date || ''} onChange={(e) => update('date', e.target.value)} className="rounded-none mt-1" />
              </div>
              <div>
                <Label>End date (optional)</Label>
                <Input type="date" value={form.end_date || ''} onChange={(e) => update('end_date', e.target.value)} className="rounded-none mt-1" />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={form.time || ''} onChange={(e) => update('time', e.target.value)} className="rounded-none mt-1" />
              </div>
              <div>
                <Label>End time</Label>
                <Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} className="rounded-none mt-1" />
              </div>
            </div>
          ) : (
            <div>
              <Label>Date options</Label>
              <div className="flex gap-2 mt-1">
                <Input type="date" value={optionInput} onChange={(e) => setOptionInput(e.target.value)} className="rounded-none" />
                <Button type="button" variant="outline" className="rounded-none" onClick={addOption}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.date_options.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-1 text-xs">
                    {d}
                    <button type="button" onClick={() => removeOption(d)} className="text-zinc-500 hover:text-zinc-950">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <Label>Pick owner label</Label>
                <Input
                  value={form.pick_owner || ''}
                  onChange={(e) => update('pick_owner', e.target.value)}
                  placeholder="e.g. Client"
                  className="rounded-none mt-1"
                />
              </div>
            </div>
          )}

          <div className="border-t border-zinc-200 pt-4 space-y-2">
            <p className="overline text-zinc-500">Parties on site</p>
            <p className="text-xs text-zinc-500 font-body">Who must attend — drives calendar colors and legend.</p>
            <div className="flex flex-wrap gap-3">
              {choices.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm font-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.required_parties || []).includes(name)}
                    onChange={() => toggleParty(name)}
                  />
                  {name}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 space-y-3">
            <p className="overline text-zinc-500">Assigned</p>
            <Input value={form.assigned_to} onChange={(e) => update('assigned_to', e.target.value)} placeholder="Name" className="rounded-none" />
            <Input value={form.assigned_phone} onChange={(e) => update('assigned_phone', e.target.value)} placeholder="Phone" className="rounded-none" />
            <Input value={form.assigned_email} onChange={(e) => update('assigned_email', e.target.value)} placeholder="Email" className="rounded-none" />
          </div>

          {initial && !requestPick && (
            <div className="border-t border-zinc-200 pt-4">
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.completed)}
                  onChange={(e) => update('completed', e.target.checked)}
                />
                Mark as completed (shows ✓ on calendar)
              </label>
            </div>
          )}

          <div className="border-t border-zinc-200 pt-4">
            <label className="flex items-start gap-3 text-sm font-body cursor-pointer">
              <input
                type="checkbox"
                checked={form.visibility === 'admin_only'}
                onChange={(e) => update('visibility', e.target.checked ? 'admin_only' : 'public')}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                  <Lock className="h-3.5 w-3.5" />
                  Visible only to me (admin-only)
                </span>
                <span className="block text-xs text-zinc-500 mt-0.5">
                  Hidden from the client share link, pick links, and the .ics export shown to clients.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-none">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
