import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import {
  categoryPresetsFromConfig,
  DEFAULT_CATEGORY_PRESETS,
  DEFAULT_EVENT_PRESETS,
  eventPresetsFromConfig,
} from '@/lib/eventPresets'
import { firstNameOnly, normalizeListingParties, partiesForSave } from '@/lib/listingParties'
import { HEADER_IMAGE_SPEC, HERO_IMAGE_SPEC } from '@/lib/imageSpecs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function emptyEventRow() {
  return { title: '', category: 'general' }
}

function emptyCategoryRow() {
  return { value: '', label: '' }
}

function ImageSpecBlock({ spec }) {
  return (
    <div className="mt-2 rounded-none border border-zinc-100 bg-zinc-50 px-3 py-2.5 space-y-1.5">
      <p className="text-xs font-body text-zinc-700 leading-snug">{spec.summary}</p>
      <ul className="text-xs font-body text-zinc-600 leading-snug list-disc list-inside space-y-0.5">
        {spec.specs.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ListingSettingsPanel({
  propertySlug,
  config,
  listingParties,
  onSaved,
}) {
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [headerImageUrl, setHeaderImageUrl] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentEmail, setAgentEmail] = useState('')
  const [eventRows, setEventRows] = useState([])
  const [categoryRows, setCategoryRows] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!config) return
    setHeroImageUrl(config.hero_image_url || '')
    setHeaderImageUrl(config.header_image_url || '')
    const parties = normalizeListingParties(config.listing_parties || listingParties)
    setAgentName(parties.agent?.name || '')
    setAgentEmail(parties.agent?.email || '')
    setEventRows(eventPresetsFromConfig(config).map((r) => ({ ...r })))
    setCategoryRows(categoryPresetsFromConfig(config).map((r) => ({ ...r })))
  }, [config, listingParties])

  const updateEventRow = (index, field, value) => {
    setEventRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const updateCategoryRow = (index, field, value) => {
    setCategoryRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const save = async () => {
    if (!propertySlug) return
    const event_presets = eventRows
      .map((r) => ({
        title: (r.title || '').trim(),
        category: (r.category || 'general').trim() || 'general',
      }))
      .filter((r) => r.title)
    const category_presets = categoryRows
      .map((r) => ({
        value: (r.value || '').trim(),
        label: (r.label || r.value || '').trim(),
      }))
      .filter((r) => r.value)

    if (!event_presets.length || !category_presets.length) {
      toast.error('Keep at least one event and one category')
      return
    }

    const parties = normalizeListingParties(listingParties)
    parties.agent = {
      ...parties.agent,
      name: firstNameOnly(agentName.trim()) || parties.agent.name,
      email: agentEmail.trim(),
    }

    setSaving(true)
    try {
      await api.updateConfig(propertySlug, {
        hero_image_url: heroImageUrl.trim(),
        header_image_url: headerImageUrl.trim(),
        event_presets,
        category_presets,
        listing_parties: partiesForSave(
          parties.agent,
          parties.coordinator,
          parties.clients.map((c) => ({ ...c })),
        ),
      })
      toast.success('Settings saved')
      onSaved?.()
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetEventPresets = () => setEventRows(DEFAULT_EVENT_PRESETS.map((r) => ({ ...r })))
  const resetCategoryPresets = () => setCategoryRows(DEFAULT_CATEGORY_PRESETS.map((r) => ({ ...r })))

  const categoryChoices = categoryRows.length ? categoryRows : DEFAULT_CATEGORY_PRESETS

  return (
    <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5 space-y-6" data-testid="listing-settings-panel">
      <div>
        <p className="overline text-zinc-500 mb-0.5">Transaction settings</p>
        <h3 className="font-display text-xl font-light tracking-tight text-zinc-950">Branding, agent contact, and New Event lists</h3>
      </div>

      <div className="bg-white border border-zinc-200 p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Images (URL)</p>
        <p className="text-sm text-zinc-600 font-body leading-snug">
          Paste image URLs below. Upload from your computer is planned for a later release — use the specs so
          images fit the layout.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="settings-hero-url">{HERO_IMAGE_SPEC.title}</Label>
            <Input
              id="settings-hero-url"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              className="rounded-none mt-1 font-mono text-xs"
              placeholder="https://…"
            />
            <ImageSpecBlock spec={HERO_IMAGE_SPEC} />
          </div>
          <div>
            <Label htmlFor="settings-header-url">{HEADER_IMAGE_SPEC.title}</Label>
            <Input
              id="settings-header-url"
              value={headerImageUrl}
              onChange={(e) => setHeaderImageUrl(e.target.value)}
              className="rounded-none mt-1 font-mono text-xs"
              placeholder="/header.png or https://…"
            />
            <ImageSpecBlock spec={HEADER_IMAGE_SPEC} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Agent contact</p>
        <p className="text-sm text-zinc-600 font-body leading-snug">
          Used for email sign-off and your party on the calendar. Client colors and deal type are in Transaction admin (04).
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="settings-agent-name">Agent name</Label>
            <Input
              id="settings-agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="rounded-none mt-1"
              placeholder="First name"
            />
          </div>
          <div>
            <Label htmlFor="settings-agent-email">Agent email</Label>
            <Input
              id="settings-agent-email"
              type="email"
              value={agentEmail}
              onChange={(e) => setAgentEmail(e.target.value)}
              className="rounded-none mt-1"
              placeholder="you@example.com"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">New Event — titles</p>
          <Button type="button" variant="ghost" size="sm" className="rounded-none text-xs h-8" onClick={resetEventPresets}>
            Reset defaults
          </Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {eventRows.map((row, index) => (
            <div key={`ev-${index}`} className="flex flex-wrap gap-2 items-center">
              <Input
                value={row.title}
                onChange={(e) => updateEventRow(index, 'title', e.target.value)}
                className="rounded-none flex-1 min-w-[10rem] text-sm"
                placeholder="Event title"
              />
              <select
                value={row.category}
                onChange={(e) => updateEventRow(index, 'category', e.target.value)}
                className="h-10 border border-zinc-300 px-2 text-sm min-w-[8rem]"
              >
                {categoryChoices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label || c.value}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-none shrink-0 h-10 w-10"
                aria-label="Remove event preset"
                onClick={() => setEventRows((rows) => rows.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none text-xs"
          onClick={() => setEventRows((rows) => [...rows, emptyEventRow()])}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add event
        </Button>
      </div>

      <div className="bg-white border border-zinc-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">New Event — categories</p>
          <Button type="button" variant="ghost" size="sm" className="rounded-none text-xs h-8" onClick={resetCategoryPresets}>
            Reset defaults
          </Button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {categoryRows.map((row, index) => (
            <div key={`cat-${index}`} className="flex flex-wrap gap-2 items-center">
              <Input
                value={row.value}
                onChange={(e) => updateCategoryRow(index, 'value', e.target.value)}
                className="rounded-none w-32 text-sm font-mono"
                placeholder="value"
              />
              <Input
                value={row.label}
                onChange={(e) => updateCategoryRow(index, 'label', e.target.value)}
                className="rounded-none flex-1 min-w-[8rem] text-sm"
                placeholder="Label"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-none shrink-0 h-10 w-10"
                aria-label="Remove category"
                onClick={() => setCategoryRows((rows) => rows.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none text-xs"
          onClick={() => setCategoryRows((rows) => [...rows, emptyCategoryRow()])}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add category
        </Button>
      </div>

      <Button
        className="rounded-none text-xs uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800"
        disabled={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  )
}
