import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import {
  clientFormRows,
  MAX_CLIENTS,
  normalizeListingParties,
  partiesForSave,
} from '@/lib/listingParties'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ListingPartiesPanel({ propertySlug, listingParties, onSaved }) {
  const [agent, setAgent] = useState({ name: '', email: '', color: '#e0e7ff' })
  const [clients, setClients] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const p = normalizeListingParties(listingParties)
    setAgent({ ...p.agent })
    setClients(clientFormRows(p))
  }, [listingParties])

  const updateClient = (index, field, value) => {
    setClients((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const save = async () => {
    if (!propertySlug) return
    setSaving(true)
    try {
      const payload = partiesForSave(agent, clients)
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
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Agent & clients</p>
        <p className="text-sm text-zinc-600 font-body leading-snug mt-1">
          Agent name replaces “Walter Stauss” on the calendar. Up to {MAX_CLIENTS} client names with email and
          legend colors.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 items-end border-b border-zinc-100 pb-4">
        <div className="sm:col-span-2">
          <Label htmlFor="party-agent-name">Agent name</Label>
          <Input
            id="party-agent-name"
            value={agent.name}
            onChange={(e) => setAgent((a) => ({ ...a, name: e.target.value }))}
            className="rounded-none mt-1"
            placeholder="Listing agent"
          />
        </div>
        <div>
          <Label htmlFor="party-agent-color">Color</Label>
          <Input
            id="party-agent-color"
            type="color"
            value={agent.color}
            onChange={(e) => setAgent((a) => ({ ...a, color: e.target.value }))}
            className="rounded-none mt-1 h-10 w-full p-1 cursor-pointer"
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="party-agent-email">Agent email</Label>
          <Input
            id="party-agent-email"
            type="email"
            value={agent.email}
            onChange={(e) => setAgent((a) => ({ ...a, email: e.target.value }))}
            className="rounded-none mt-1"
            placeholder="optional"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Clients (max {MAX_CLIENTS})</p>
        {clients.map((row, index) => (
          <div key={index} className="grid sm:grid-cols-4 gap-2 items-end">
            <div className="sm:col-span-2">
              <Label htmlFor={`party-client-name-${index}`}>Client {index + 1} name</Label>
              <Input
                id={`party-client-name-${index}`}
                value={row.name}
                onChange={(e) => updateClient(index, 'name', e.target.value)}
                className="rounded-none mt-1"
                placeholder={index === 0 ? 'e.g. Smith family' : 'optional'}
              />
            </div>
            <div>
              <Label htmlFor={`party-client-email-${index}`}>Email</Label>
              <Input
                id={`party-client-email-${index}`}
                type="email"
                value={row.email}
                onChange={(e) => updateClient(index, 'email', e.target.value)}
                className="rounded-none mt-1"
                placeholder="optional"
              />
            </div>
            <div>
              <Label htmlFor={`party-client-color-${index}`}>Color</Label>
              <Input
                id={`party-client-color-${index}`}
                type="color"
                value={row.color}
                onChange={(e) => updateClient(index, 'color', e.target.value)}
                className="rounded-none mt-1 h-10 w-full p-1 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>

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
