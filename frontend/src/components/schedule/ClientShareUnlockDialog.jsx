import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import api from '@/lib/scheduleApi'
import { setClientToken } from '@/lib/clientAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ClientShareUnlockDialog({ propertySlug, propertyName, onSuccess }) {
  const [passcode, setPasscode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setPasscode('')
    setErr('')
  }, [propertySlug])

  const submit = async (e) => {
    e.preventDefault()
    if (!passcode.trim() || !propertySlug) return
    setSubmitting(true)
    setErr('')
    try {
      const res = await api.verifyClient(propertySlug, passcode.trim())
      if (res.valid && res.client_token) {
        setClientToken(propertySlug, res.client_token)
        onSuccess()
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
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-zinc-200 p-8 space-y-4"
        data-testid="client-share-unlock"
      >
        <div className="flex items-center gap-2 font-display text-2xl font-light tracking-tight text-zinc-950">
          <Lock className="h-5 w-5" />
          Client access
        </div>
        <p className="font-body text-sm text-zinc-600">
          Enter the passcode for <strong>{propertyName || 'this listing'}</strong> to view the schedule.
        </p>
        <div>
          <Label htmlFor="client-pass">Passcode</Label>
          <Input
            id="client-pass"
            type="password"
            autoComplete="off"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-1 rounded-none"
          />
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        </div>
        <Button type="submit" className="rounded-none w-full" disabled={submitting || !passcode.trim()}>
          View schedule
        </Button>
      </form>
    </div>
  )
}
