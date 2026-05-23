import { useEffect, useState } from 'react'
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
import { formatLongDate } from '@/lib/scheduleUtils'

export default function PickDateDialog({ open, onOpenChange, event, onSubmit }) {
  const [selected, setSelected] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && event) {
      const opts = event.date_options || []
      setSelected(opts[0] || '')
      setName('')
    }
  }, [open, event])

  if (!event) return null

  const options = event.date_options || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected || !name.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ date: selected, picked_by: name.trim() })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-zinc-300 sm:max-w-md" data-testid="pick-date-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">
            Pick your preferred date
          </DialogTitle>
          <DialogDescription className="font-body">
            {event.title} — choose one of the options below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="overline text-zinc-500 mb-3 block">Available dates</Label>
            <div className="space-y-2">
              {options.map((iso) => (
                <label
                  key={iso}
                  className={`flex items-center gap-3 border p-3 cursor-pointer transition-colors ${
                    selected === iso ? 'border-zinc-950 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="pick-date"
                    value={iso}
                    checked={selected === iso}
                    onChange={() => setSelected(iso)}
                    className="h-4 w-4"
                  />
                  <span className="font-body text-sm">{formatLongDate(iso)}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="pick-name">Your name</Label>
            <Input
              id="pick-name"
              required
              placeholder="e.g. Client"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 rounded-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-none"
              disabled={submitting || !name.trim() || !selected}
            >
              Confirm date
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
