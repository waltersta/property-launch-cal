/** Client-facing URLs include ?property=<slug> so each listing has its own link. */

export function buildScheduleShareUrl(origin, propertySlug) {
  const params = new URLSearchParams({ view: 'share' })
  if (propertySlug) params.set('property', propertySlug)
  return `${origin}/?${params.toString()}`
}

export function buildPickUrl(origin, pickToken, propertySlug) {
  const base = `${origin}/pick/${pickToken}`
  if (!propertySlug) return base
  return `${base}?property=${encodeURIComponent(propertySlug)}`
}

export function propertyQueryParam(propertySlug) {
  return propertySlug ? { property: propertySlug } : {}
}
