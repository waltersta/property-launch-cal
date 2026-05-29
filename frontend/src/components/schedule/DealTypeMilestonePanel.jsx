import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { DEAL_PRESETS } from '@/lib/dealPresets'
import { computeMilestone } from '@/lib/milestone'
import { Button } from '@/components/ui/button'

export default function DealTypeMilestonePanel({ propertySlug, dealType: dealTypeProp, events, onSaved }) {
  const [dealType, setDealType] = useState('listing')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDealType(dealTypeProp === 'purchase' ? 'purchase' : 'listing')
  }, [dealTypeProp])

  const milestonePreview = useMemo(() => computeMilestone(dealType, events), [dealType, events])

  const save = async () => {
    if (!propertySlug) return
    const preset = DEAL_PRESETS[dealType] || DEAL_PRESETS.listing
    setSaving(true)
    try {
      await api.updateConfig(propertySlug, {
        deal_type: preset.deal_type,
        schedule_type_label: preset.schedule_type_label,
        tagline: preset.tagline,
      })
      toast.success('Deal type saved')
      onSaved?.()
    } catch {
      toast.error('Could not save deal type')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200 p-4 space-y-3 md:col-span-2">
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Deal type &amp; milestone</p>
      <p className="text-sm text-zinc-600 font-body leading-snug">
        The hero line shows <strong>Going live</strong> from a <strong>Listing live</strong> event, or{' '}
        <strong>Closing</strong> from <strong>COE</strong> / <strong>Close of escrow</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={dealType === 'listing' ? 'default' : 'outline'}
          size="sm"
          className="rounded-none text-xs uppercase tracking-widest"
          onClick={() => setDealType('listing')}
        >
          Listing
        </Button>
        <Button
          type="button"
          variant={dealType === 'purchase' ? 'default' : 'outline'}
          size="sm"
          className="rounded-none text-xs uppercase tracking-widest"
          onClick={() => setDealType('purchase')}
        >
          Purchase
        </Button>
      </div>
      <p className="text-sm font-body text-zinc-700 border border-zinc-100 bg-zinc-50 px-3 py-2">
        {milestonePreview ? (
          <>
            Hero preview: <strong>{milestonePreview.label}</strong> {milestonePreview.dateLabel}
            <span className="text-zinc-500"> (from “{milestonePreview.eventTitle}”)</span>
          </>
        ) : (
          <span className="text-zinc-500">
            No milestone date yet — add a dated “{dealType === 'purchase' ? 'COE' : 'Listing live'}” event on the
            timeline.
          </span>
        )}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-none text-xs uppercase tracking-widest"
        disabled={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : 'Save deal type'}
      </Button>
    </div>
  )
}
