import { useState } from 'react'
import { Copy, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    window.prompt(`Copy:`, text)
  }
}

export default function BetaInvitePanel() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSubmitting(true)
    try {
      const res = await api.betaInvite({ name: name.trim(), email: email.trim() })
      setInviteUrl(res.invite_url)
      toast.success(`Trial ready for ${res.agent.name}`)
      setName('')
      setEmail('')
    } catch (err) {
      const detail = err.response?.data?.detail
      let msg = 'Could not create invite'
      if (typeof detail === 'string') msg = detail
      else if (Array.isArray(detail) && detail[0]?.msg) msg = detail[0].msg
      else if (!err.response) msg = 'Could not reach the server'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200 p-4 space-y-3 md:col-span-2" data-testid="beta-invite-panel">
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Invite beta tester</p>
      <p className="text-sm text-zinc-600 font-body leading-snug">
        Creates a private trial listing with sample events. Send the invite link — no setup on your side.
      </p>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="beta-name">Name</Label>
          <Input
            id="beta-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-none mt-1"
            placeholder="First name"
            required
          />
        </div>
        <div>
          <Label htmlFor="beta-email">Email</Label>
          <Input
            id="beta-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-none mt-1"
            placeholder="agent@example.com"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            className="rounded-none text-xs uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800"
            disabled={submitting}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            {submitting ? 'Creating…' : 'Invite beta tester'}
          </Button>
        </div>
      </form>
      {inviteUrl ? (
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <p className="text-xs text-zinc-600 font-body">Invite link (send to tester)</p>
          <code className="block text-xs bg-zinc-100 p-2 break-all text-zinc-800">{inviteUrl}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none text-xs uppercase tracking-widest"
            onClick={() => copyText(inviteUrl, 'Invite link')}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy invite link
          </Button>
        </div>
      ) : null}
    </div>
  )
}
