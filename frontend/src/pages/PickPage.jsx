import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import api from '@/lib/scheduleApi'
import { formatLongDate } from '@/lib/scheduleUtils'
import PickDateDialog from '@/components/schedule/PickDateDialog'

export default function PickPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api
      .shareGet(token)
      .then((res) => {
        setData(res)
        if (res.event.status === 'picked') {
          setSubmitted(true)
        } else {
          setOpen(true)
        }
      })
      .catch(() => toast.error('Invalid or expired pick link'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (pickData) => {
    const updated = await api.sharePick(token, pickData)
    setData(updated)
    setOpen(false)
    setSubmitted(true)
    toast.success('Date confirmed — thank you!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body text-zinc-500">
        Loading…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body text-zinc-500">
        Pick link not found.
      </div>
    )
  }

  if (submitted || data.event.status === 'picked') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <Toaster position="top-center" />
        <CheckCircle2 className="h-14 w-14 text-emerald-600 mb-4" />
        <p className="font-property-title text-2xl sm:text-3xl text-zinc-950 mb-2">{data.property_name}</p>
        <h1 className="section-heading text-zinc-950">Thank you</h1>
        <p className="font-body text-zinc-600 mt-4 max-w-md">
          Your choice of <strong>{formatLongDate(data.event.date)}</strong> for{' '}
          <strong>{data.event.title}</strong> has been recorded. Your agent has been notified.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <Toaster position="top-center" />
      <div className="max-w-md text-center mb-8">
        <p className="font-property-title text-2xl sm:text-3xl text-zinc-950 mb-2">{data.property_name}</p>
        <h1 className="section-heading">{data.event.title}</h1>
        <p className="font-body text-zinc-600 mt-3 text-sm">{data.event.description}</p>
        <p className="font-body text-zinc-500 mt-2 text-xs">Choose one of the available dates below.</p>
      </div>
      <PickDateDialog open={open} onOpenChange={setOpen} event={data.event} onSubmit={handleSubmit} />
    </div>
  )
}
