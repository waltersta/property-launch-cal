import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api, { ADMIN_KEY } from '@/lib/scheduleApi'
import { setAgentProfile } from '@/lib/agentAuth'
import { Button } from '@/components/ui/button'

export default function WelcomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Missing invite token. Ask your host for a new link.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await api.claimAgentInvite(token)
        if (cancelled) return
        localStorage.setItem(ADMIN_KEY, res.admin_token)
        setAgentProfile({
          is_super_admin: false,
          agent: res.agent,
          onboarding_required: res.onboarding_required,
        })
        toast.success(`Welcome, ${res.agent.name}`)
        navigate(`/?property=${encodeURIComponent(res.property_slug)}&admin=1`, { replace: true })
      } catch {
        if (!cancelled) {
          setError('This invite link is invalid or has already been used.')
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body text-zinc-600">
        Setting up your trial calendar…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 font-body">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-3xl font-light tracking-tight text-zinc-950">Property Launch Calendar</h1>
        <p className="text-zinc-600">{error || 'Invite link required.'}</p>
        <Button asChild variant="outline" className="rounded-none">
          <Link to="/">Go to home</Link>
        </Button>
      </div>
    </div>
  )
}
