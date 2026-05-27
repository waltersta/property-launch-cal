import { useCallback, useEffect, useRef, useState } from 'react'
import { feedbackDragDrop, feedbackDragPick, feedbackDragStart } from '@/lib/dragFeedback'
import { dayCount } from '@/lib/scheduleUtils'

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

function chipPresentationFromElement(el) {
  if (!el) return {}
  const cs = window.getComputedStyle(el)
  return {
    background: cs.backgroundColor,
    color: cs.color,
    backgroundImage: cs.backgroundImage !== 'none' ? cs.backgroundImage : undefined,
  }
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
  const [pressedId, setPressedId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [overIso, setOverIso] = useState(null)
  const [ghost, setGhost] = useState(null)
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
    setPressedId(null)
    setDraggingId(null)
    setOverIso(null)
    setGhost(null)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const findDayIso = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY)
    const cell = el?.closest?.(DAY_CELL_SELECTOR)
    return cell?.getAttribute('data-day-iso') || null
  }

  const updateGhostPosition = (s, clientX, clientY) => {
    setGhost({
      event: s.event,
      x: clientX - s.grabOffsetX,
      y: clientY - s.grabOffsetY,
      width: s.ghostWidth,
      height: s.ghostHeight,
      style: s.ghostStyle,
      spanDays: s.spanDays,
    })
  }

  const startDrag = useCallback(
    (e, event, sourceIso) => {
      if (!enabled) return
      if (e.button !== 0 && e.pointerType === 'mouse') return
      if (e.pointerType === 'mouse' && !e.isPrimary) return

      e.stopPropagation()
      feedbackDragPick()
      setPressedId(event.id)

      const isTouch = e.pointerType === 'touch'
      const startX = e.clientX
      const startY = e.clientY
      const startElement = e.currentTarget
      const rect = startElement.getBoundingClientRect()
      const grabOffsetX = e.clientX - rect.left
      const grabOffsetY = e.clientY - rect.top
      const ghostStyle = chipPresentationFromElement(startElement)
      const spanDays = dayCount(event.date, event.end_date)

      const activate = (s) => {
        s.activated = true
        setPressedId(null)
        setDraggingId(s.event.id)
        feedbackDragStart()
        updateGhostPosition(s, s.lastX ?? startX, s.lastY ?? startY)
        try {
          s.startElement.setPointerCapture(s.pointerId)
        } catch {
          /* no-op */
        }
      }

      const onMove = (mv) => {
        const s = stateRef.current
        if (!s) return
        s.lastX = mv.clientX
        s.lastY = mv.clientY
        const dx = mv.clientX - s.startX
        const dy = mv.clientY - s.startY
        const dist = Math.hypot(dx, dy)

        if (!s.activated) {
          if (s.isTouch) {
            if (dist > touchTolerance) {
              setPressedId(null)
              cleanup()
            }
            return
          }
          if (dist >= distance) activate(s)
          else return
        }

        if (mv.cancelable) mv.preventDefault()
        updateGhostPosition(s, mv.clientX, mv.clientY)
        setOverIso(findDayIso(mv.clientX, mv.clientY))
      }

      const onUp = (up) => {
        const s = stateRef.current
        if (!s) return
        const wasActivated = s.activated
        const ev = s.event
        const src = s.sourceIso
        const x = up?.clientX ?? startX
        const y = up?.clientY ?? startY
        cleanup()
        if (!wasActivated) return
        suppressNextClick()
        const iso = findDayIso(x, y)
        if (iso && iso !== src) {
          feedbackDragDrop()
          onDrop?.(ev, iso)
        }
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
        startElement,
        isTouch,
        activated: false,
        delayTimer: null,
        grabOffsetX,
        grabOffsetY,
        ghostWidth: rect.width,
        ghostHeight: rect.height,
        ghostStyle,
        spanDays,
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
          activate(s)
        }, touchDelay)
      }
    },
    [cleanup, distance, enabled, onDrop, touchDelay, touchTolerance],
  )

  return {
    pressedId,
    draggingId,
    overIso,
    ghost,
    startDrag,
    isDragging: draggingId != null,
  }
}
