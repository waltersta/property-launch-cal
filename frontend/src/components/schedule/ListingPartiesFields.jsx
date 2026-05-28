import {
  clientFormRows,
  DEFAULT_LISTING_PARTIES,
  MAX_CLIENTS,
} from '@/lib/listingParties'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function emptyPartiesState() {
  return {
    agent: { ...DEFAULT_LISTING_PARTIES.agent },
    coordinator: { ...DEFAULT_LISTING_PARTIES.coordinator },
    clients: clientFormRows(DEFAULT_LISTING_PARTIES),
  }
}

export function partiesStateFromConfig(listingParties) {
  const p = listingParties || DEFAULT_LISTING_PARTIES
  return {
    agent: { ...p.agent },
    coordinator: { ...(p.coordinator || DEFAULT_LISTING_PARTIES.coordinator) },
    clients: clientFormRows(p),
  }
}

export default function ListingPartiesFields({ agent, coordinator, clients, onAgentChange, onCoordinatorChange, onClientChange }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3 items-end border-b border-zinc-100 pb-4">
        <div className="sm:col-span-2">
          <Label htmlFor="party-agent-name">Agent first name</Label>
          <Input
            id="party-agent-name"
            value={agent.name}
            onChange={(e) => onAgentChange({ ...agent, name: e.target.value })}
            className="rounded-none mt-1"
            placeholder="e.g. Walter"
          />
        </div>
        <div>
          <Label htmlFor="party-agent-color">Color</Label>
          <Input
            id="party-agent-color"
            type="color"
            value={agent.color}
            onChange={(e) => onAgentChange({ ...agent, color: e.target.value })}
            className="rounded-none mt-1 h-10 w-full p-1 cursor-pointer"
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="party-agent-email">Agent email</Label>
          <Input
            id="party-agent-email"
            type="email"
            value={agent.email}
            onChange={(e) => onAgentChange({ ...agent, email: e.target.value })}
            className="rounded-none mt-1"
            placeholder="optional"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 items-end border-b border-zinc-100 pb-4">
        <div className="sm:col-span-2">
          <Label htmlFor="party-coordinator-name">Transaction coordinator</Label>
          <Input
            id="party-coordinator-name"
            value={coordinator.name}
            onChange={(e) => onCoordinatorChange({ ...coordinator, name: e.target.value })}
            className="rounded-none mt-1"
            placeholder="Full name"
          />
        </div>
        <div>
          <Label htmlFor="party-coordinator-color">Color</Label>
          <Input
            id="party-coordinator-color"
            type="color"
            value={coordinator.color}
            onChange={(e) => onCoordinatorChange({ ...coordinator, color: e.target.value })}
            className="rounded-none mt-1 h-10 w-full p-1 cursor-pointer"
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="party-coordinator-email">Coordinator email</Label>
          <Input
            id="party-coordinator-email"
            type="email"
            value={coordinator.email}
            onChange={(e) => onCoordinatorChange({ ...coordinator, email: e.target.value })}
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
                onChange={(e) => onClientChange(index, 'name', e.target.value)}
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
                onChange={(e) => onClientChange(index, 'email', e.target.value)}
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
                onChange={(e) => onClientChange(index, 'color', e.target.value)}
                className="rounded-none mt-1 h-10 w-full p-1 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
