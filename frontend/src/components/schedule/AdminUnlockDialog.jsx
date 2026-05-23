import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import api from '@/lib/scheduleApi'
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

export default function AdminUnlockDialog({ open, onOpenChange, onSuccess }) {
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (open) {
      setToken('')
      setErr('')
    }
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    if (!token.trim()) return
    setSubmitting(true)
    setErr('')
    try {
      const res = await api.verifyAdmin(token.trim())
      if (res.valid && res.admin_token) {
        onSuccess(res.admin_token)
      } else {
        setErr('Incorrect passcode')
      }
    } catch {
      setErr('Could not verify. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-zinc-300 sm:max-w-sm" data-testid="admin-unlock-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin access
          </DialogTitle>
          <DialogDescription className="font-body">
            Enter the admin passcode to edit the schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="admin-pass">Passcode</Label>
            <Input
              id="admin-pass"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 rounded-none"
            />
            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-none" disabled={submitting || !token.trim()}>
              Unlock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
