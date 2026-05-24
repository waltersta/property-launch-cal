import { useCallback, useEffect, useState } from 'react'
import { Copy, Link2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { Button } from '@/components/ui/button'

async function copyText(url, label) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(`${label} copied`)
  } catch {
    window.prompt(`Copy this link:`, url)
  }
}

export default function ClientSharePanel({ propertySlug, propertyName }) {
  const [links, setLinks] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!propertySlug) return
    try {
      const data = await api.getClientLinks(propertySlug)
      setLinks(data)
    } catch {
      toast.error('Could not load client links')
    } finally {
      setLoading(false)
    }
  }, [propertySlug])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 font-body">
        Loading client links…
      </div>
    )
  }

  if (!links) return null

  const pick = links.pick_links?.[0]

  return (
    <div className="border border-zinc-200 bg-zinc-50 p-6 sm:p-8 space-y-6" data-testid="client-share-panel">
      <div>
        <p className="overline text-zinc-500 mb-1">Send to client</p>
        <h3 className="font-display text-2xl font-light tracking-tight text-zinc-950">
          Share links for {propertyName || 'this listing'}
        </h3>
        <p className="font-body text-sm text-zinc-600 mt-2 max-w-2xl">
          Send the <strong>schedule link</strong> for full review, or the <strong>pick-a-date link</strong> if you only
          want the client to choose between the two key handover dates. You will be notified here (and by email if SMTP is
          configured) when he confirms.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Full schedule review</p>
          <p className="text-sm text-zinc-600 font-body">
            Calendar, timeline, and “Pick a date” on the key handover milestone.
          </p>
          <code className="block text-xs bg-zinc-100 p-2 break-all text-zinc-700">{links.schedule_url}</code>
          <Button
            variant="outline"
            className="rounded-none w-full text-xs uppercase tracking-widest"
            onClick={() => copyText(links.schedule_url, 'Schedule link')}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copy schedule link
          </Button>
        </div>

        {pick ? (
          <div className="bg-white border border-amber-200 p-5 space-y-3 ring-1 ring-amber-100">
            <p className="text-xs uppercase tracking-widest text-amber-800 font-medium">
              Date pick only — recommended for client
            </p>
            <p className="text-sm text-zinc-600 font-body">
              <strong>{pick.title}</strong>
              {pick.pick_owner && <> · for {pick.pick_owner}</>}
            </p>
            <ul className="text-sm text-zinc-700 space-y-1 font-body">
              {pick.date_options?.map((o) => (
                <li key={o.iso}>· {o.label}</li>
              ))}
            </ul>
            <code className="block text-xs bg-zinc-100 p-2 break-all text-zinc-700">{pick.pick_url}</code>
            <Button
              className="rounded-none w-full text-xs uppercase tracking-widest"
              onClick={() => copyText(pick.pick_url, 'Pick-a-date link')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy pick-a-date link
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 p-5 text-sm text-zinc-500 font-body">
            No events awaiting a client date pick.
          </div>
        )}
      </div>

      {links.notifications_enabled && links.notify_email && (
        <p className="flex items-center gap-2 text-xs text-zinc-500 font-body">
          <Mail className="h-4 w-4 shrink-0" />
          Pick confirmations will notify: <strong className="text-zinc-700">{links.notify_email}</strong>
        </p>
      )}
    </div>
  )
}
