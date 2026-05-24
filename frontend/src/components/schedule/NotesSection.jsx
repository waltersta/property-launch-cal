import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { NOTE_STATUSES } from '@/lib/scheduleApi'
import { Button } from '@/components/ui/button'
import NoteDialog from '@/components/schedule/NoteDialog'

function formatTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotesSection({ notes, isAdmin, onSave, onDelete }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (note) => {
    setEditing(note)
    setDialogOpen(true)
  }

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 border-t border-zinc-100" id="notes">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="section-subhead text-zinc-400 mb-2">02 — Notes</p>
          <h2 className="section-heading">Notes</h2>
          <p className="font-body text-zinc-500 text-sm mt-2 max-w-2xl">
            Track follow-ups and status by responsible party. Visible to you and your client on the share link.
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" className="rounded-none text-xs uppercase tracking-widest" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add note
          </Button>
        )}
      </div>

      <div className="overflow-x-auto border border-zinc-200">
        <table className="w-full text-sm font-body" data-testid="notes-table">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Responsible party</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium min-w-[200px]">Description</th>
              {isAdmin && <th className="px-4 py-3 w-24" />}
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-zinc-500">
                  No notes yet.
                </td>
              </tr>
            ) : (
              notes.map((n) => (
                <tr key={n.id} className="border-t border-zinc-100 align-top">
                  <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{formatTimestamp(n.recorded_at)}</td>
                  <td className="px-4 py-3 text-zinc-950 font-medium">{n.responsible_party || '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">{n.status || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{n.description || '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(n)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-600"
                          onClick={() => onDelete(n)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        statuses={NOTE_STATUSES}
        onSubmit={async (payload) => {
          await onSave(payload, editing)
          setDialogOpen(false)
          setEditing(null)
        }}
      />
    </section>
  )
}
