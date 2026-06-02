import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { BUILTIN_HEADER_PATH, HEADER_IMAGE_SPEC } from '@/lib/imageSpecs'
import ImageSpecBlock from '@/components/schedule/ImageSpecBlock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SiteHeaderPanel({ onSaved }) {
  const [headerImageUrl, setHeaderImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await api.getSiteBrand()
        if (!cancelled) setHeaderImageUrl(data.header_image_url || BUILTIN_HEADER_PATH)
      } catch {
        if (!cancelled) toast.error('Could not load site header')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateSiteBrand({ header_image_url: headerImageUrl.trim() })
      toast.success('Site header saved (all transactions)')
      onSaved?.()
    } catch {
      toast.error('Could not save site header')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="schedule-panel-card p-4 space-y-3" data-testid="site-header-panel">
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Site header banner</p>
      <p className="text-sm text-zinc-600 font-body leading-snug">
        Same strip above the hero on <strong>every</strong> transaction. <strong>Save site header</strong> stores this
        path or URL in the database (site-wide). The original{' '}
        <code className="text-xs bg-zinc-100 px-1">{BUILTIN_HEADER_PATH}</code> file still ships with the app — it is
        not uploaded; you reference it by path. File upload from your computer is not built yet.
      </p>
      <div>
        <Label htmlFor="site-header-url">{HEADER_IMAGE_SPEC.title}</Label>
        <Input
          id="site-header-url"
          value={headerImageUrl}
          onChange={(e) => setHeaderImageUrl(e.target.value)}
          className="rounded-none mt-1 font-mono text-xs"
          placeholder={`${BUILTIN_HEADER_PATH} or https://…`}
          disabled={loading}
        />
        <ImageSpecBlock spec={HEADER_IMAGE_SPEC} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none text-xs uppercase tracking-widest"
          disabled={loading || saving}
          onClick={() => setHeaderImageUrl(BUILTIN_HEADER_PATH)}
        >
          Use built-in {BUILTIN_HEADER_PATH}
        </Button>
        <Button
          type="button"
          className="rounded-none text-xs uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800"
          disabled={saving || loading}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save site header'}
        </Button>
      </div>
    </div>
  )
}
