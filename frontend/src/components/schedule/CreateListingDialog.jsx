import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateListingDialog({ open, onOpenChange, onCreated, dialogTitle = 'New listing' }) {
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newClientPass, setNewClientPass] = useState('')
  const [creating, setCreating] = useState(false)

  const reset = () => {
    setNewName('')
    setNewSlug('')
    setNewClientPass('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const row = await api.createProperty({
        property_name: newName.trim(),
        property_slug: newSlug.trim() || undefined,
        client_passcode: newClientPass.trim() || undefined,
      })
      toast.success(`Listing “${row.property_name}” created`)
      reset()
      onOpenChange(false)
      onCreated?.(row)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not create listing')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-light tracking-tight">{dialogTitle}</DialogTitle>
          <DialogDescription className="font-body">
            Creates a new property schedule. You will switch to that listing in admin view.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <Label htmlFor="new-property-name">Property name</Label>
            <Input
              id="new-property-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 rounded-none"
              placeholder="123 Oak Street"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="new-property-slug">URL slug (optional)</Label>
            <Input
              id="new-property-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="mt-1 rounded-none"
              placeholder="123-oak-street"
            />
          </div>
          <div>
            <Label htmlFor="new-client-pass">Client passcode (optional)</Label>
            <Input
              id="new-client-pass"
              type="password"
              value={newClientPass}
              onChange={(e) => setNewClientPass(e.target.value)}
              className="mt-1 rounded-none"
            />
          </div>
          <Button type="submit" className="rounded-none w-full text-xs uppercase tracking-widest" disabled={creating}>
            Create listing
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
