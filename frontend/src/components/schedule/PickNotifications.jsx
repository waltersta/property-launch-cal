import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { formatLongDate } from '@/lib/scheduleUtils'
import { Button } from '@/components/ui/button'

export default function PickNotifications({ enabled, onPickReceived }) {
  const [items, setItems] = useState([])
  const [dismissed, setDismissed] = useState(false)
  const seenRef = useRef(new Set())

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const rows = await api.listNotifications(true)
      setItems(rows)
      for (const row of rows) {
        if (!seenRef.current.has(row.id)) {
          seenRef.current.add(row.id)
          toast.success(`${row.picked_by} chose ${formatLongDate(row.picked_date)}`, {
            description: row.event_title,
          })
          onPickReceived?.(rows)
        }
      }
    } catch {
      /* ignore when not admin */
    }
  }, [enabled, onPickReceived])

  useEffect(() => {
    load()
    if (!enabled) return undefined
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [enabled, load])

  const dismissAll = async () => {
    try {
      await api.markAllNotificationsRead()
      setItems([])
      setDismissed(true)
    } catch {
      toast.error('Could not dismiss notifications')
    }
  }

  if (!enabled || dismissed || items.length === 0) return null

  const latest = items[0]

  return (
    <div
      className="bg-emerald-50 border border-emerald-200 px-4 py-3 sm:px-6"
      data-testid="pick-notification-banner"
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <Bell className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-900 text-sm sm:text-base">
              {latest.picked_by} chose {formatLongDate(latest.picked_date)}
            </p>
            <p className="text-sm text-emerald-800 mt-0.5">
              {latest.event_title}
              {items.length > 1 && ` · +${items.length - 1} more`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-emerald-300 bg-white text-xs"
            onClick={dismissAll}
          >
            Dismiss
          </Button>
          <button
            type="button"
            className="p-1 text-emerald-700 hover:text-emerald-900"
            onClick={() => setDismissed(true)}
            aria-label="Hide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
