let audioCtx = null

function audioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) audioCtx = new window.AudioContext()
  return audioCtx
}

function tone(freq, durationSec = 0.04, gain = 0.07) {
  const ctx = audioContext()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') void ctx.resume()
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    amp.gain.value = gain
    osc.connect(amp).connect(ctx.destination)
    const t0 = ctx.currentTime
    osc.start(t0)
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec)
    osc.stop(t0 + durationSec)
  } catch {
    /* no-op */
  }
}

/** Light tap when a draggable chip is pressed. */
export function feedbackDragPick() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(6)
  tone(520, 0.03, 0.06)
}

/** Stronger pulse when drag activates. */
export function feedbackDragStart() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 24, 14])
  tone(660, 0.05, 0.09)
}

/** Soft confirm on successful drop. */
export function feedbackDragDrop() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12)
  tone(440, 0.04, 0.06)
}
