import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const empty = {
  recorded_at: '',
  responsible_party: '',
  status: 'Open',
  description: '',
}

export default function NoteDialog({ open, onOpenChange, initial, statuses, onSubmit }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          recorded_at: initial.recorded_at?.slice(0, 16) || '',
          responsible_party: initial.responsible_party || '',
          status: initial.status || 'Open',
          description: initial.description || '',
        })
      } else {
        const now = new Date()
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setForm({ ...empty, recorded_at: local })
      }
    }
  }, [open, initial])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const recorded_at = form.recorded_at
      ? new Date(form.recorded_at).toISOString()
      : new Date().toISOString()
    onSubmit({
      recorded_at,
      responsible_party: form.responsible_party.trim(),
      status: form.status,
      description: form.description.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-zinc-300 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-light">
            {initial ? 'Edit note' : 'Add note'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="note-time">Timestamp</Label>
            <Input
              id="note-time"
              type="datetime-local"
              value={form.recorded_at}
              onChange={(e) => update('recorded_at', e.target.value)}
              className="mt-1 rounded-none"
            />
          </div>
          <div>
            <Label htmlFor="note-party">Responsible party</Label>
            <Input
              id="note-party"
              value={form.responsible_party}
              onChange={(e) => update('responsible_party', e.target.value)}
              className="mt-1 rounded-none"
              placeholder="e.g. Walter Stauss, Client, Stager"
            />
          </div>
          <div>
            <Label htmlFor="note-status">Status</Label>
            <select
              id="note-status"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm bg-white"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="note-desc">Description</Label>
            <textarea
              id="note-desc"
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm"
            />
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
