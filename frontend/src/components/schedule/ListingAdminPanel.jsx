import { useCallback, useEffect, useState } from 'react'
import { Copy, Link2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

async function copyText(url, label) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(`${label} copied`)
  } catch {
    window.prompt(`Copy this link:`, url)
  }
}

export default function ListingAdminPanel({ propertySlug, propertyName }) {
  const [clientPasscode, setClientPasscode] = useState('')
  const [savingPasscode, setSavingPasscode] = useState(false)
  const [links, setLinks] = useState(null)
  const [linksLoading, setLinksLoading] = useState(true)

  const loadLinks = useCallback(async () => {
    if (!propertySlug) return
    setLinksLoading(true)
    try {
      const data = await api.getClientLinks(propertySlug)
      setLinks(data)
    } catch {
      toast.error('Could not load client links')
      setLinks(null)
    } finally {
      setLinksLoading(false)
    }
  }, [propertySlug])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  const saveClientPasscode = async () => {
    if (!propertySlug) return
    setSavingPasscode(true)
    try {
      await api.updateConfig(propertySlug, { client_passcode: clientPasscode })
      toast.success(clientPasscode ? 'Client passcode set' : 'Client passcode removed')
      setClientPasscode('')
    } catch {
      toast.error('Could not update passcode')
    } finally {
      setSavingPasscode(false)
    }
  }

  const pick = links?.pick_links?.[0]

  return (
    <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5" data-testid="listing-admin-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <p className="overline text-zinc-500 mb-0.5">Listing admin</p>
          <h3 className="font-display text-xl font-light tracking-tight text-zinc-950">
            {propertyName || 'This listing'}
          </h3>
        </div>
        <code className="text-xs text-zinc-500 font-mono">?property={propertySlug}</code>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Client passcode</p>
          <p className="text-sm text-zinc-600 font-body leading-snug">
            Optional lock on the share link. Save blank to remove.
          </p>
          <div>
            <Label htmlFor="client-passcode-set" className="sr-only">
              New client passcode
            </Label>
            <Input
              id="client-passcode-set"
              type="password"
              value={clientPasscode}
              onChange={(e) => setClientPasscode(e.target.value)}
              className="rounded-none"
              placeholder="Set or leave empty to clear"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none text-xs uppercase tracking-widest"
            disabled={savingPasscode}
            onClick={saveClientPasscode}
          >
            Save passcode
          </Button>
        </div>

        <div className="bg-white border border-zinc-200 p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Send to client</p>
          {linksLoading ? (
            <p className="text-sm text-zinc-500 font-body">Loading links…</p>
          ) : links ? (
            <>
              <div className="space-y-2">
                <p className="text-xs text-zinc-600 font-body">Full schedule</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none w-full text-xs uppercase tracking-widest"
                  onClick={() => copyText(links.schedule_url, 'Schedule link')}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Copy schedule link
                </Button>
              </div>
              {pick ? (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <p className="text-xs text-zinc-600 font-body">
                    Pick-a-date · <strong>{pick.title}</strong>
                  </p>
                  <Button
                    size="sm"
                    className="rounded-none w-full text-xs uppercase tracking-widest"
                    onClick={() => copyText(pick.pick_url, 'Pick-a-date link')}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy pick link
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-body">No date-pick events right now.</p>
              )}
              {links.notifications_enabled && links.notify_email && (
                <p className="flex items-center gap-1.5 text-[0.65rem] text-zinc-500 font-body pt-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  Picks notify {links.notify_email}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500 font-body">Links unavailable.</p>
          )}
        </div>
      </div>
    </div>
  )
}
