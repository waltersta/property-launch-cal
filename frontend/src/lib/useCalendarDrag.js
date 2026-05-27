import { useCallback, useEffect, useRef, useState } from 'react'

const DAY_CELL_SELECTOR = '[data-day-iso]'

/**
 * Minimal drag-and-drop for calendar chips, built on native pointer events.
 *
 * Replaces @dnd-kit/core which has activation issues on React 19. Behavior:
 *   - Mouse / pen: drag activates after pointer moves >= `distance` px from
 *     the press origin.
 *   - Touch: drag activates after `touchDelay` ms held in place. Movement
 *     beyond `touchTolerance` before the delay expires aborts (treated as
 *     a scroll).
 *
 * Drop targets are detected with `document.elementFromPoint` looking for the
 * nearest ancestor matching `[data-day-iso]`. Chips also need
 * `style="touch-action: none"` so the browser doesn't steal touch gestures.
 */
export function useCalendarDrag({
  enabled,
  onDrop,
  distance = 4,
  touchDelay = 200,
  touchTolerance = 6,
} = {}) {
  const [draggingId, setDraggingId] = useState(null)
  const [overIso, setOverIso] = useState(null)
  const stateRef = useRef(null)

  const cleanup = useCallback(() => {
    const s = stateRef.current
    if (!s) return
    if (s.delayTimer) clearTimeout(s.delayTimer)
    document.removeEventListener('pointermove', s.onMove)
    document.removeEventListener('pointerup', s.onUp)
    document.removeEventListener('pointercancel', s.onUp)
    window.removeEventListener('keydown', s.onKey)
    window.removeEventListener('contextmenu', s.onUp)
    window.removeEventListener('blur', s.onUp)
    if (s.activated && s.startElement && typeof s.startElement.releasePointerCapture === 'function') {
      try { s.startElement.releasePointerCapture(s.pointerId) } catch { /* no-op */ }
    }
    stateRef.current = null
    setDraggingId(null)
    setOverIso(null)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const findDayIso = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY)
    const cell = el?.closest?.(DAY_CELL_SELECTOR)
    return cell?.getAttribute('data-day-iso') || null
  }

  const startDrag = useCallback(
    (e, event, sourceIso) => {
      if (!enabled) return
      if (e.button !== 0 && e.pointerType === 'mouse') return
      if (e.pointerType === 'mouse' && !e.isPrimary) return

      const isTouch = e.pointerType === 'touch'
      const startX = e.clientX
      const startY = e.clientY

      const onMove = (mv) => {
        const s = stateRef.current
        if (!s) return
        const dx = mv.clientX - s.startX
        const dy = mv.clientY - s.startY
        const dist = Math.hypot(dx, dy)

        if (!s.activated) {
          if (s.isTouch) {
            // Touch: movement before delay aborts (treat as scroll).
            if (dist > touchTolerance) cleanup()
            return
          }
          if (dist >= distance) {
            s.activated = true
            setDraggingId(s.event.id)
            try {
              s.startElement.setPointerCapture(s.pointerId)
            } catch {
              /* defensive: some browsers throw if pointer is already gone */
            }
          } else {
            return
          }
        }

        if (mv.cancelable) mv.preventDefault()
        const iso = findDayIso(mv.clientX, mv.clientY)
        setOverIso(iso)
      }

      const onUp = (up) => {
        const s = stateRef.current
        if (!s) return
        const wasActivated = s.activated
        const ev = s.event
        const src = s.sourceIso
        cleanup()
        if (!wasActivated) return
        const x = up?.clientX ?? startX
        const y = up?.clientY ?? startY
        const iso = findDayIso(x, y)
        if (iso && iso !== src) onDrop?.(ev, iso)
      }

      const onKey = (kv) => {
        if (kv.key === 'Escape') cleanup()
      }

      const newState = {
        event,
        sourceIso,
        startX,
        startY,
        pointerId: e.pointerId,
        startElement: e.currentTarget,
        isTouch,
        activated: false,
        delayTimer: null,
        onMove,
        onUp,
        onKey,
      }
      stateRef.current = newState

      document.addEventListener('pointermove', onMove, { passive: false })
      document.addEventListener('pointerup', onUp)
      document.addEventListener('pointercancel', onUp)
      window.addEventListener('keydown', onKey)
      window.addEventListener('contextmenu', onUp)
      window.addEventListener('blur', onUp)

      if (isTouch) {
        newState.delayTimer = setTimeout(() => {
          const s = stateRef.current
          if (!s || s !== newState) return
          s.activated = true
          setDraggingId(s.event.id)
          try {
            s.startElement.setPointerCapture(s.pointerId)
          } catch {
            /* no-op */
          }
        }, touchDelay)
      }
    },
    [cleanup, distance, enabled, onDrop, touchDelay, touchTolerance],
  )

  return { draggingId, overIso, startDrag }
}
