import { formatLongDate } from '@/lib/scheduleUtils'

const LISTING_TITLE_MATCH = (title) => {
  const t = (title || '').trim().toLowerCase()
  return t === 'listing live' || t.includes('listing live')
}

const PURCHASE_TITLE_MATCH = (title) => {
  const t = (title || '').trim().toLowerCase()
  return t === 'coe' || t.includes('close of escrow') || t === 'close of escrow'
}

/** @param {'listing'|'purchase'} dealType */
export function findMilestoneEvent(dealType, events) {
  const list = events || []
  const match = dealType === 'purchase' ? PURCHASE_TITLE_MATCH : LISTING_TITLE_MATCH
  return list.find((e) => match(e.title) && e.date)
}

/** @param {'listing'|'purchase'} dealType */
export function computeMilestone(dealType, events) {
  const type = dealType === 'purchase' ? 'purchase' : 'listing'
  const ev = findMilestoneEvent(type, events)
  if (!ev?.date) return null
  return {
    label: type === 'purchase' ? 'Closing' : 'Going live',
    dateLabel: formatLongDate(ev.date),
    eventTitle: ev.title,
  }
}

export function milestoneHeroSuffix(milestone, launchDateLabel) {
  if (milestone?.dateLabel) {
    return ` · ${milestone.label} ${milestone.dateLabel}`
  }
  if (launchDateLabel?.trim()) {
    return ` · Going live ${launchDateLabel.trim()}`
  }
  return ''
}
