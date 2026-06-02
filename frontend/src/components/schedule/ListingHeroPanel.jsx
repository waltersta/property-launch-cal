import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { HERO_IMAGE_SPEC } from '@/lib/imageSpecs'
import ImageSpecBlock from '@/components/schedule/ImageSpecBlock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ListingHeroPanel({ propertySlug, config, onSaved }) {
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!config) return
    setHeroImageUrl(config.hero_image_url || '')
  }, [config])

  const save = async () => {
    if (!propertySlug) return
    setSaving(true)
    try {
      await api.updateConfig(propertySlug, { hero_image_url: heroImageUrl.trim() })
      toast.success('Hero image saved for this transaction')
      onSaved?.()
    } catch {
      toast.error('Could not save hero image')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="schedule-panel-card p-4 space-y-3 md:col-span-2" data-testid="listing-hero-panel">
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Transaction hero image</p>
      <p className="text-sm text-zinc-600 font-body leading-snug">
        Background photo behind this property name and tagline only. Paste a public image URL (upload from your
        computer is planned later).
      </p>
      <div>
        <Label htmlFor="admin-hero-url">{HERO_IMAGE_SPEC.title}</Label>
        <Input
          id="admin-hero-url"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          className="rounded-none mt-1 font-mono text-xs"
          placeholder="https://…"
        />
        <ImageSpecBlock spec={HERO_IMAGE_SPEC} />
      </div>
      <Button
        type="button"
        className="rounded-none text-xs uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800"
        disabled={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : 'Save hero image'}
      </Button>
    </div>
  )
}
