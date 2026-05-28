import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api, { ADMIN_KEY } from '@/lib/scheduleApi'
import ListingPartiesFields, { emptyPartiesState } from '@/components/schedule/ListingPartiesFields'
import { partiesForSave } from '@/lib/listingParties'
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

export default function NewListingPage() {
  const navigate = useNavigate()
  const isAdmin = Boolean(localStorage.getItem(ADMIN_KEY))

  const [propertyName, setPropertyName] = useState('')
  const [propertySlug, setPropertySlug] = useState('')
  const [clientPasscode, setClientPasscode] = useState('')
  const [scheduleLabel, setScheduleLabel] = useState(PRESETS.listing.schedule_type_label)
  const [heroTagline, setHeroTagline] = useState(PRESETS.listing.tagline)
  const [createLabel, setCreateLabel] = useState(PRESETS.listing.create_property_label)
  const parties = emptyPartiesState()
  const [agent, setAgent] = useState(parties.agent)
  const [coordinator, setCoordinator] = useState(parties.coordinator)
  const [clients, setClients] = useState(parties.clients)
  const [creating, setCreating] = useState(false)

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body text-zinc-600 px-6">
        <p>
          Admin access required.{' '}
          <Link to="/" className="text-blue-600 underline">
            Back to schedule
          </Link>
        </p>
      </div>
    )
  }

  const applyPreset = (key) => {
    const p = PRESETS[key]
    setScheduleLabel(p.schedule_type_label)
    setHeroTagline(p.tagline)
    setCreateLabel(p.create_property_label)
  }

  const updateClient = (index, field, value) => {
    setClients((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!propertyName.trim()) return
    setCreating(true)
    try {
      const row = await api.createProperty({
        property_name: propertyName.trim(),
        property_slug: propertySlug.trim() || undefined,
        client_passcode: clientPasscode.trim() || undefined,
        tagline: heroTagline.trim() || PRESETS.listing.tagline,
        schedule_type_label: scheduleLabel.trim() || PRESETS.listing.schedule_type_label,
        create_property_label: createLabel.trim() || PRESETS.listing.create_property_label,
        listing_parties: partiesForSave(agent, coordinator, clients),
      })
      toast.success(`Created “${row.property_name}”`)
      navigate(`/?property=${encodeURIComponent(row.property_slug)}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not create listing')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link to="/" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-950">
            ← Back to schedule
          </Link>
          <h1 className="font-display text-3xl font-light tracking-tight text-zinc-950 mt-4">New transaction</h1>
          <p className="font-body text-zinc-600 mt-2 text-sm">
            Set up the property, hero labels, and everyone on this deal. You can change parties later on the
            transaction page.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Property</p>
          <div>
            <Label htmlFor="new-property-name">Property name</Label>
            <Input
              id="new-property-name"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              className="rounded-none mt-1"
              placeholder="123 Oak Street"
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="new-property-slug">URL slug (optional)</Label>
            <Input
              id="new-property-slug"
              value={propertySlug}
              onChange={(e) => setPropertySlug(e.target.value)}
              className="rounded-none mt-1"
              placeholder="123-oak-street"
            />
          </div>
          <div>
            <Label htmlFor="new-client-pass">Client passcode (optional)</Label>
            <Input
              id="new-client-pass"
              type="password"
              value={clientPasscode}
              onChange={(e) => setClientPasscode(e.target.value)}
              className="rounded-none mt-1"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Hero labels</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-none text-xs" onClick={() => applyPreset('listing')}>
              Listing preset
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-none text-xs" onClick={() => applyPreset('buyer')}>
              Buyer preset
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="schedule-type-label">Schedule type (overline)</Label>
              <Input
                id="schedule-type-label"
                value={scheduleLabel}
                onChange={(e) => setScheduleLabel(e.target.value)}
                className="rounded-none mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hero-tagline">Tagline</Label>
              <Input
                id="hero-tagline"
                value={heroTagline}
                onChange={(e) => setHeroTagline(e.target.value)}
                className="rounded-none mt-1"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Parties</p>
          <ListingPartiesFields
            agent={agent}
            coordinator={coordinator}
            clients={clients}
            onAgentChange={setAgent}
            onCoordinatorChange={setCoordinator}
            onClientChange={updateClient}
          />
        </section>

        <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-8">
          <Button type="submit" className="rounded-none text-xs uppercase tracking-widest" disabled={creating}>
            {creating ? 'Creating…' : 'Create transaction'}
          </Button>
          <Button type="button" variant="outline" className="rounded-none" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
