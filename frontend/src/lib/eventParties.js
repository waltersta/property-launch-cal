import {
  agentDisplayName,
  clientDisplayNames,
  coordinatorDisplayName,
  firstNameOnly,
} from '@/lib/listingParties'

function partyNamesMatch(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  return firstNameOnly(a) === firstNameOnly(b)
}
import { isTwoPartyKeyEvent } from '@/lib/scheduleUtils'

/** All selectable party names for an event (agent + clients). */
export function partyChoices(listingParties) {
  const names = [agentDisplayName(listingParties)]
  const coord = coordinatorDisplayName(listingParties)
  if (coord) names.push(coord)
  for (const c of clientDisplayNames(listingParties)) {
    if (!names.includes(c)) names.push(c)
  }
  return names
}

export function alignPartyNames(names, listingParties) {
  const choices = partyChoices(listingParties)
  return (names || [])
    .map((n) => choices.find((c) => partyNamesMatch(c, n)) || firstNameOnly(n) || n)
    .filter(Boolean)
}

export function defaultPartiesForEvent(event, listingParties) {
  if (event?.required_parties?.length) return alignPartyNames(event.required_parties, listingParties)
  if (isTwoPartyKeyEvent(event) || event?.category === 'keys') {
    return partyChoices(listingParties)
  }
  return [agentDisplayName(listingParties)]
}
