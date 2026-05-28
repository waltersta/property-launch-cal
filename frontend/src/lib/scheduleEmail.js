import { agentDisplayName } from '@/lib/listingParties'

export const DEFAULT_SCHEDULE_EMAIL_INTRO =
  "Here's the link to the calendar and timeline. This link will never change, but the events on the calendar and timeline might. Keep the link handy.<P>Our transaction coordinator is _______ (email: _____________)."

/** Paragraph break: no space after <P> in source text. */
const TC_PARAGRAPH_RE =
  /<?P>\s*Our transaction coordinator is .+? \(email:\s*[^)]*\)\.?/gi

export function hasCoordinator(parties) {
  return Boolean((parties?.coordinator?.name || '').trim())
}

export function stripCoordinatorFromIntro(intro) {
  return (intro || '').replace(TC_PARAGRAPH_RE, '').trim()
}

export function fillCoordinatorInIntro(intro, parties) {
  const name = (parties?.coordinator?.name || '').trim()
  const email = (parties?.coordinator?.email || '').trim()
  if (!name) return { intro: intro || '', ok: false }
  let out = intro || DEFAULT_SCHEDULE_EMAIL_INTRO
  if (!TC_PARAGRAPH_RE.test(out) && !out.includes('_______')) {
    const base = stripCoordinatorFromIntro(out)
    out = `${base}<P>Our transaction coordinator is _______ (email: _____________).`
  }
  TC_PARAGRAPH_RE.lastIndex = 0
  out = out.replace('_______', name)
  if (out.includes('___________')) {
    out = out.replace('___________', email)
  }
  return { intro: out, ok: true }
}

export function formatIntroParagraphs(intro) {
  return (intro || '').replace(/<p>\s*/gi, '\n').trim()
}

export function buildScheduleEmailBody(introText, scheduleUrl, listingParties) {
  let intro = (introText || '').trim() || DEFAULT_SCHEDULE_EMAIL_INTRO

  if (hasCoordinator(listingParties)) {
    const name = listingParties.coordinator.name.trim()
    const email = (listingParties.coordinator.email || '').trim()
    if (intro.includes('_______')) intro = intro.replace('_______', name)
    if (intro.includes('___________')) intro = intro.replace('___________', email)
  } else {
    intro = stripCoordinatorFromIntro(intro)
  }

  intro = formatIntroParagraphs(intro)

  const url = (scheduleUrl || '').trim()
  const linkBlock = url ? `\n\n${url}` : ''
  const agentName = agentDisplayName(listingParties)
  const salutation = agentName ? `\n\nBest,\n${agentName}` : ''

  return `${intro}${linkBlock}${salutation}`
}

export function composeScheduleEmail(scheduleUrl, propertyName, listingParties, introText) {
  const recipients = (listingParties?.clients || [])
    .map((c) => (c?.email || '').trim())
    .filter(Boolean)
  const subject = encodeURIComponent(`${propertyName || 'Property'} schedule`)
  const body = encodeURIComponent(buildScheduleEmailBody(introText, scheduleUrl, listingParties))
  const to = encodeURIComponent(recipients.join(','))
  return `mailto:${to}?subject=${subject}&body=${body}`
}
