import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import ListingPartiesFields, { partiesStateFromConfig } from '@/components/schedule/ListingPartiesFields'
import { normalizeListingParties, partiesForSave } from '@/lib/listingParties'
import { Button } from '@/components/ui/button'

export default function ListingPartiesPanel({ propertySlug, listingParties, onSaved }) {
  const [agent, setAgent] = useState({ name: '', email: '', color: '#e0e7ff' })
  const [coordinator, setCoordinator] = useState({ name: '', email: '', color: '#ddd6fe' })
  const [clients, setClients] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const p = partiesStateFromConfig(normalizeListingParties(listingParties))
    setAgent(p.agent)
    setCoordinator(p.coordinator)
    setClients(p.clients)
  }, [listingParties])

  const updateClient = (index, field, value) => {
    setClients((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const save = async () => {
    if (!propertySlug) return
    setSaving(true)
    try {
      const payload = partiesForSave(agent, coordinator, clients)
      await api.updateConfig(propertySlug, { listing_parties: payload })
      toast.success('Parties saved')
      onSaved?.()
    } catch {
      toast.error('Could not save parties')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-200 p-4 space-y-4 md:col-span-2" data-testid="listing-parties-panel">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Parties on this transaction</p>
        <p className="text-sm text-zinc-600 font-body leading-snug mt-1">
          Agent, transaction coordinator, and up to four clients — colors drive the calendar legend.
        </p>
      </div>
      <ListingPartiesFields
        agent={agent}
        coordinator={coordinator}
        clients={clients}
        onAgentChange={setAgent}
        onCoordinatorChange={setCoordinator}
        onClientChange={updateClient}
      />
      <Button
        variant="outline"
        size="sm"
        className="rounded-none text-xs uppercase tracking-widest"
        disabled={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : 'Save parties'}
      </Button>
    </div>
  )
}
