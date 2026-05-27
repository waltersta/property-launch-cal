import { useCallback, useEffect, useRef, useState } from 'react'

const DAY_CELL_SELECTOR = '[data-day-iso]'

function suppressNextClick() {
  const block = (e) => {
    e.stopPropagation()
    e.preventDefault()
    document.removeEventListener('click', block, true)
  }
  document.addEventListener('click', block, true)
  setTimeout(() => document.removeEventListener('click', block, true), 0)
}

/**
 * Native pointer-event drag for calendar chips (no @dnd-kit).
 * Drop targets: nearest `[data-day-iso]` under the pointer.
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
    if (s.activated && s.startElement?.releasePointerCapture) {
      try {
        s.startElement.releasePointerCapture(s.pointerId)
      } catch {
        /* no-op */
      }
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

      e.stopPropagation()

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
            if (dist > touchTolerance) cleanup()
            return
          }
          if (dist >= distance) {
            s.activated = true
            setDraggingId(s.event.id)
            try {
              s.startElement.setPointerCapture(s.pointerId)
            } catch {
              /* no-op */
            }
          } else {
            return
          }
        }

        if (mv.cancelable) mv.preventDefault()
        setOverIso(findDayIso(mv.clientX, mv.clientY))
      }

      const onUp = (up) => {
        const s = stateRef.current
        if (!s) return
        const wasActivated = s.activated
        const ev = s.event
        const src = s.sourceIso
        cleanup()
        if (!wasActivated) return
        suppressNextClick()
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

  return { draggingId, overIso, startDrag, isDragging: draggingId != null }
}
