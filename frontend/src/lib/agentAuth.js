export const AGENT_PROFILE_KEY = 'rd_agent_profile'

export function getAgentProfile() {
  try {
    const raw = localStorage.getItem(AGENT_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAgentProfile(profile) {
  if (profile) {
    localStorage.setItem(AGENT_PROFILE_KEY, JSON.stringify(profile))
  } else {
    localStorage.removeItem(AGENT_PROFILE_KEY)
  }
}

export function clearAgentSession() {
  setAgentProfile(null)
}
