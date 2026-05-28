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

function PersonRow({
  nameLabel,
  nameId,
  nameValue,
  namePlaceholder,
  onNameChange,
  emailLabel,
  emailId,
  emailValue,
  onEmailChange,
  colorLabel = 'Color',
  colorId,
  colorValue,
  onColorChange,
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={nameId}>{nameLabel}</Label>
        <Input
          id={nameId}
          value={nameValue}
          onChange={onNameChange}
          className="rounded-none mt-1"
          placeholder={namePlaceholder}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <Label htmlFor={emailId}>{emailLabel}</Label>
          <Input
            id={emailId}
            type="email"
            value={emailValue}
            onChange={onEmailChange}
            className="rounded-none mt-1"
            placeholder="optional"
          />
        </div>
        <div className="min-w-[84px]">
          <Label htmlFor={colorId}>{colorLabel}</Label>
          <Input
            id={colorId}
            type="color"
            value={colorValue}
            onChange={onColorChange}
            className="rounded-none mt-1 h-10 w-[84px] p-1 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}

export default function ListingPartiesFields({
  agent,
  coordinator,
  clients,
  onAgentChange,
  onCoordinatorChange,
  onClientChange,
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-zinc-100 pb-4">
        <PersonRow
          nameLabel="Agent first name"
          nameId="party-agent-name"
          nameValue={agent.name}
          namePlaceholder="e.g. Walter"
          onNameChange={(e) => onAgentChange({ ...agent, name: e.target.value })}
          emailLabel="Agent email"
          emailId="party-agent-email"
          emailValue={agent.email}
          onEmailChange={(e) => onAgentChange({ ...agent, email: e.target.value })}
          colorId="party-agent-color"
          colorValue={agent.color}
          onColorChange={(e) => onAgentChange({ ...agent, color: e.target.value })}
        />
      </div>

      <div className="border-b border-zinc-100 pb-4">
        <PersonRow
          nameLabel="Transaction coordinator"
          nameId="party-coordinator-name"
          nameValue={coordinator.name}
          namePlaceholder="Full name"
          onNameChange={(e) => onCoordinatorChange({ ...coordinator, name: e.target.value })}
          emailLabel="Coordinator email"
          emailId="party-coordinator-email"
          emailValue={coordinator.email}
          onEmailChange={(e) => onCoordinatorChange({ ...coordinator, email: e.target.value })}
          colorId="party-coordinator-color"
          colorValue={coordinator.color}
          onColorChange={(e) => onCoordinatorChange({ ...coordinator, color: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Clients (max {MAX_CLIENTS})</p>
        {clients.map((row, index) => (
          <div key={index} className="border-b border-zinc-100 pb-4">
            <PersonRow
              nameLabel={`Client ${index + 1} name`}
              nameId={`party-client-name-${index}`}
              nameValue={row.name}
              namePlaceholder={index === 0 ? 'e.g. Smith family' : 'optional'}
              onNameChange={(e) => onClientChange(index, 'name', e.target.value)}
              emailLabel="Email"
              emailId={`party-client-email-${index}`}
              emailValue={row.email}
              onEmailChange={(e) => onClientChange(index, 'email', e.target.value)}
              colorId={`party-client-color-${index}`}
              colorValue={row.color}
              onColorChange={(e) => onClientChange(index, 'color', e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
