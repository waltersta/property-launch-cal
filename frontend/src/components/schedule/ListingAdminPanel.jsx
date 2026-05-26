import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { buildScheduleShareUrl } from '@/lib/shareUrls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ListingAdminPanel({ propertySlug, propertyName, onListingCreated }) {
  const [clientPasscode, setClientPasscode] = useState('')
  const [savingPasscode, setSavingPasscode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newClientPass, setNewClientPass] = useState('')
  const [creating, setCreating] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [adminPassConfirm, setAdminPassConfirm] = useState('')
  const [savingAdminPass, setSavingAdminPass] = useState(false)

  const adminPassMismatch = Boolean(adminPassConfirm) && adminPass !== adminPassConfirm
  const adminPassReady = adminPass.length >= 4 && adminPass === adminPassConfirm

  const saveAdminPasscode = async () => {
    if (!adminPassReady) return
    setSavingAdminPass(true)
    try {
      await api.changeAdminPasscode(adminPass)
      toast.success('Admin passcode updated. Use it on your next sign-in.')
      setAdminPass('')
      setAdminPassConfirm('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update admin passcode')
    } finally {
      setSavingAdminPass(false)
    }
  }

  const saveClientPasscode = async () => {
    if (!propertySlug) return
    setSavingPasscode(true)
    try {
      await api.updateConfig(propertySlug, { client_passcode: clientPasscode })
      toast.success(clientPasscode ? 'Client passcode set' : 'Client passcode removed')
      setClientPasscode('')
    } catch {
      toast.error('Could not update passcode')
    } finally {
      setSavingPasscode(false)
    }
  }

  const createListing = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const row = await api.createProperty({
        property_name: newName.trim(),
        property_slug: newSlug.trim() || undefined,
        client_passcode: newClientPass.trim() || undefined,
      })
      const url = buildScheduleShareUrl(window.location.origin, row.property_slug)
      toast.success(`Listing created. Share: ${url}`)
      setNewName('')
      setNewSlug('')
      setNewClientPass('')
      onListingCreated?.(row)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not create listing')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="border border-zinc-200 bg-zinc-50 p-6 sm:p-8 space-y-8" data-testid="listing-admin-panel">
      <div>
        <p className="overline text-zinc-500 mb-1">Listing settings</p>
        <h3 className="font-display text-2xl font-light tracking-tight text-zinc-950">
          {propertyName || 'This listing'}
        </h3>
        <p className="font-body text-sm text-zinc-600 mt-2">
          Slug in URLs: <code className="text-zinc-800">?property={propertySlug}</code>
        </p>
      </div>

      <div className="bg-white border border-zinc-200 p-5 space-y-3 max-w-lg">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Admin passcode</p>
        <p className="text-sm text-zinc-600 font-body">
          The passcode you enter to unlock admin mode. Minimum 4 characters. Applies to every listing on this site.
        </p>
        <div>
          <Label htmlFor="admin-passcode-new">New admin passcode</Label>
          <Input
            id="admin-passcode-new"
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            className="mt-1 rounded-none"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="admin-passcode-confirm">Confirm new passcode</Label>
          <Input
            id="admin-passcode-confirm"
            type="password"
            value={adminPassConfirm}
            onChange={(e) => setAdminPassConfirm(e.target.value)}
            className="mt-1 rounded-none"
            autoComplete="new-password"
          />
          {adminPassMismatch && (
            <p className="text-xs text-red-600 mt-1">Passcodes do not match.</p>
          )}
        </div>
        <Button
          variant="outline"
          className="rounded-none text-xs uppercase tracking-widest"
          disabled={savingAdminPass || !adminPassReady}
          onClick={saveAdminPasscode}
        >
          Save admin passcode
        </Button>
      </div>

      <div className="bg-white border border-zinc-200 p-5 space-y-3 max-w-lg">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Client passcode (share link)</p>
        <p className="text-sm text-zinc-600 font-body">
          When set, clients must enter this passcode before viewing the schedule. Leave blank and save to remove
          protection.
        </p>
        <div>
          <Label htmlFor="client-passcode-set">New client passcode</Label>
          <Input
            id="client-passcode-set"
            type="password"
            value={clientPasscode}
            onChange={(e) => setClientPasscode(e.target.value)}
            className="mt-1 rounded-none"
            placeholder="Set or leave empty to clear"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-none text-xs uppercase tracking-widest"
          disabled={savingPasscode}
          onClick={saveClientPasscode}
        >
          Save client passcode
        </Button>
      </div>

      <form onSubmit={createListing} className="bg-white border border-zinc-200 p-5 space-y-3 max-w-lg">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Add another listing</p>
        <div>
          <Label htmlFor="new-property-name">Property name</Label>
          <Input
            id="new-property-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-1 rounded-none"
            placeholder="123 Oak Street"
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
        <Button type="submit" className="rounded-none text-xs uppercase tracking-widest" disabled={creating}>
          Create listing
        </Button>
      </form>
    </div>
  )
}
