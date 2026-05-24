export function clientStorageKey(propertySlug) {
  return `rd_client_${propertySlug || 'default'}`
}

export function getClientToken(propertySlug) {
  return sessionStorage.getItem(clientStorageKey(propertySlug))
}

export function setClientToken(propertySlug, token) {
  if (token) {
    sessionStorage.setItem(clientStorageKey(propertySlug), token)
  } else {
    sessionStorage.removeItem(clientStorageKey(propertySlug))
  }
}

export function clientHeaders(propertySlug) {
  const token = getClientToken(propertySlug)
  return token ? { 'X-Client-Token': token } : {}
}
