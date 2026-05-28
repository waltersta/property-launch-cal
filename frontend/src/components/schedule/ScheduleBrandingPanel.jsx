import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRESETS = {
  listing: {
    schedule_type_label: 'Listing schedule',
    tagline: 'New Listing',
    create_property_label: 'New listing',
  },
  buyer: {
    schedule_type_label: 'Buyer schedule',
    tagline: 'New buyer',
    create_property_label: 'New buyer',
  },
}

export default function ScheduleBrandingPanel({
  propertySlug,
  scheduleTypeLabel,
  tagline,
  createPropertyLabel,
  onSaved,
}) {
  const [scheduleLabel, setScheduleLabel] = useState('')
  const [heroTagline, setHeroTagline] = useState('')
  const [createLabel, setCreateLabel] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setScheduleLabel(scheduleTypeLabel || PRESETS.listing.schedule_type_label)
    setHeroTagline(tagline || PRESETS.listing.tagline)
    setCreateLabel(createPropertyLabel || PRESETS.listing.create_property_label)
  }, [scheduleTypeLabel, tagline, createPropertyLabel])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    setScheduleLabel(p.schedule_type_label)
    setHeroTagline(p.tagline)
    setCreateLabel(p.create_property_label)
  }

  const save = async () => {
    if (!propertySlug) return
    setSaving(true)
    try {
      await api.updateConfig(propertySlug, {
        schedule_type_label: scheduleLabel.trim() || PRESETS.listing.schedule_type_label,
        tagline: heroTagline.trim() || PRESETS.listing.tagline,
        create_property_label: createLabel.trim() || PRESETS.listing.create_property_label,
      })
      toast.success('Hero labels saved')
      onSaved?.()
    } catch {
      toast.error('Could not save labels')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200 p-4 space-y-4 md:col-span-2" data-testid="schedule-branding-panel">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Hero labels</p>
        <p className="text-sm text-zinc-600 font-body leading-snug mt-1">
          Use listing or buyer presets, or customize the overline, tagline, and create-button text.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none text-xs"
          onClick={() => applyPreset('listing')}
        >
          Listing preset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none text-xs"
          onClick={() => applyPreset('buyer')}
        >
          Buyer preset
        </Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="schedule-type-label">Schedule type (hero overline)</Label>
          <Input
            id="schedule-type-label"
            value={scheduleLabel}
            onChange={(e) => setScheduleLabel(e.target.value)}
            className="rounded-none mt-1"
            placeholder="Listing schedule"
          />
        </div>
        <div>
          <Label htmlFor="hero-tagline">Tagline (hero)</Label>
          <Input
            id="hero-tagline"
            value={heroTagline}
            onChange={(e) => setHeroTagline(e.target.value)}
            className="rounded-none mt-1"
            placeholder="New Listing"
          />
        </div>
        <div>
          <Label htmlFor="create-property-label">Create button label</Label>
          <Input
            id="create-property-label"
            value={createLabel}
            onChange={(e) => setCreateLabel(e.target.value)}
            className="rounded-none mt-1"
            placeholder="New listing"
          />
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="rounded-none text-xs uppercase tracking-widest"
        disabled={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : 'Save hero labels'}
      </Button>
    </div>
  )
}
