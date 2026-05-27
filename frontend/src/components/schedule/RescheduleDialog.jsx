import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addDays, dayCount, formatLongDate } from '@/lib/scheduleUtils'

/**
 * Confirms a drag-to-reschedule. Defaults preserve the original duration:
 * dropping a 2-day event onto a new start date prefills end = start + (span - 1).
 *
 * Props:
 *   open, onOpenChange
 *   event: the original event (with date, end_date, time, ...)
 *   targetDate: the ISO date the user dropped on (becomes the new start)
 *   onConfirm({ date, end_date, time }): caller persists the change
 */
export default function RescheduleDialog({ open, onOpenChange, event, targetDate, onConfirm }) {
  const span = event ? dayCount(event.date, event.end_date) : 1
  const wasMultiDay = Boolean(event?.end_date && event.end_date !== event.date)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !event || !targetDate) return
    const newEnd = wasMultiDay ? addDays(targetDate, span - 1) : ''
    setStartDate(targetDate)
    setEndDate(newEnd)
    setTime(event.time || '')
    setSaving(false)
  }, [open, event, targetDate, span, wasMultiDay])

  if (!event) return null

  const submit = async (e) => {
    e.preventDefault()
    if (!startDate) return
    if (endDate && endDate < startDate) {
      alert('End date must be on or after start date.')
      return
    }
    setSaving(true)
    try {
      await onConfirm({
        date: startDate,
        end_date: endDate || null,
        time: time || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-zinc-300 sm:max-w-md" data-testid="reschedule-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">
            Reschedule event
          </DialogTitle>
          <DialogDescription className="font-body">
            <strong>{event.title}</strong>
            {wasMultiDay && (
              <span className="block text-xs text-zinc-500 mt-1">
                {span}-day event — adjust the end date if it should be longer or shorter.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="reschedule-start">New start date</Label>
            <Input
              id="reschedule-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-none mt-1"
              required
            />
            {startDate && (
              <p className="text-xs text-zinc-500 mt-1">{formatLongDate(startDate)}</p>
            )}
          </div>
          <div>
            <Label htmlFor="reschedule-end">End date {wasMultiDay ? '' : '(optional)'}</Label>
            <Input
              id="reschedule-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-none mt-1"
              min={startDate || undefined}
            />
          </div>
          <div>
            <Label htmlFor="reschedule-time">Time</Label>
            <Input
              id="reschedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-none mt-1"
            />
            <p className="text-xs text-zinc-500 mt-1">
              {event.time ? `Current: ${event.time}` : 'Leave blank for no specific time.'}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-none" disabled={saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
