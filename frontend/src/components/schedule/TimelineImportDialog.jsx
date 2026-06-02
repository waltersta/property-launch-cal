import { useCallback, useRef, useState } from 'react'
import { ClipboardPaste, FileUp, Loader2, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/scheduleApi'
import { formatLongDate } from '@/lib/scheduleUtils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

export default function TimelineImportDialog({
  open,
  onOpenChange,
  propertySlug,
  tzid,
  onImported,
}) {
  const [emailText, setEmailText] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseNotes, setParseNotes] = useState('')
  const [parseSource, setParseSource] = useState('')
  const [drafts, setDrafts] = useState([])
  const [mode, setMode] = useState('replace')
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  const resetPreview = useCallback(() => {
    setDrafts([])
    setParseNotes('')
    setParseSource('')
  }, [])

  const handleClose = (nextOpen) => {
    if (!nextOpen) {
      setEmailText('')
      setImagePreview(null)
      setImageDataUrl(null)
      resetPreview()
      setMode('replace')
    }
    onOpenChange(nextOpen)
  }

  const setImageFromDataUrl = (dataUrl) => {
    setImageDataUrl(dataUrl)
    setImagePreview(dataUrl)
    resetPreview()
  }

  const handlePaste = async (event) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const blob = item.getAsFile()
        if (!blob) return
        try {
          const dataUrl = await readFileAsDataUrl(blob)
          setImageFromDataUrl(dataUrl)
          toast.success('Screenshot pasted')
        } catch {
          toast.error('Could not read pasted image')
        }
        return
      }
    }
  }

  const handleEmailFile = async (file) => {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      setEmailText(text)
      resetPreview()
      toast.success('Email file loaded')
    } catch {
      toast.error('Could not read email file')
    }
  }

  const handleImageFile = async (file) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImageFromDataUrl(dataUrl)
      toast.success('Screenshot loaded')
    } catch {
      toast.error('Could not read screenshot')
    }
  }

  const handleParse = async () => {
    if (!emailText.trim() && !imageDataUrl) {
      toast.error('Paste a forwarded email or a timeline screenshot first')
      return
    }
    setParsing(true)
    resetPreview()
    try {
      const result = await api.parseTimelineImport(propertySlug, {
        text: emailText,
        image_base64: imageDataUrl,
        timezone: tzid,
      })
      setDrafts((result.events || []).map((e, i) => ({ ...e, _key: `${e.title}-${i}` })))
      setParseNotes(result.notes || '')
      setParseSource(result.source || '')
      if (!result.events?.length) {
        toast.error(result.notes || 'No events found')
      } else {
        toast.success(`Found ${result.events.length} event(s)`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not parse timeline')
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (!drafts.length) return
    if (mode === 'replace' && !window.confirm('Replace all existing events with the imported timeline?')) {
      return
    }
    setImporting(true)
    try {
      await api.applyTimelineImport(propertySlug, {
        events: drafts.map(({ _key, ...rest }) => rest),
        mode,
        update_calendar_range: true,
      })
      toast.success(mode === 'replace' ? 'Timeline replaced' : 'Events added')
      handleClose(false)
      onImported?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not import timeline')
    } finally {
      setImporting(false)
    }
  }

  const removeDraft = (key) => {
    setDrafts((rows) => rows.filter((r) => r._key !== key))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="rounded-none border-zinc-300 sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onPaste={handlePaste}
        data-testid="timeline-import-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">Import timeline</DialogTitle>
          <DialogDescription className="font-body text-left">
            Paste a forwarded TC timeline email or a screenshot from your inbox. The app converts it into calendar
            events you can review before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 font-body text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-800">
              <Mail className="h-4 w-4" />
              <Label htmlFor="import-email">Forwarded email</Label>
            </div>
            <textarea
              id="import-email"
              rows={7}
              value={emailText}
              onChange={(e) => {
                setEmailText(e.target.value)
                resetPreview()
              }}
              placeholder="Forward the TC timeline to yourself, open the message, select all, and paste here…"
              className="w-full border border-zinc-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".eml,.txt,text/plain,message/rfc822"
                className="hidden"
                onChange={(e) => handleEmailFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-none text-xs uppercase tracking-widest"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5 mr-1" />
                Upload .eml
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-800">
              <ClipboardPaste className="h-4 w-4" />
              <Label>Screenshot</Label>
            </div>
            <div
              className="border border-dashed border-zinc-300 px-4 py-6 text-center text-zinc-500"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file?.type.startsWith('image/')) handleImageFile(file)
              }}
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Timeline screenshot preview" className="max-h-48 mx-auto border border-zinc-200" />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none text-xs uppercase tracking-widest"
                    onClick={() => {
                      setImagePreview(null)
                      setImageDataUrl(null)
                      resetPreview()
                    }}
                  >
                    Remove screenshot
                  </Button>
                </div>
              ) : (
                <p>Paste a screenshot (Cmd/Ctrl+V) or upload an image of the timeline from your email.</p>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFile(e.target.files?.[0])}
            />
            {!imagePreview && (
              <Button
                type="button"
                variant="outline"
                className="rounded-none text-xs uppercase tracking-widest"
                onClick={() => imageInputRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5 mr-1" />
                Upload screenshot
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-none text-xs uppercase tracking-widest"
              onClick={handleParse}
              disabled={parsing || (!emailText.trim() && !imageDataUrl)}
            >
              {parsing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Convert to events
            </Button>
          </div>

          {parseNotes && (
            <p className="text-xs text-zinc-500">
              {parseNotes}
              {parseSource ? ` (${parseSource})` : ''}
            </p>
          )}

          {drafts.length > 0 && (
            <div className="space-y-3 border-t border-zinc-200 pt-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Preview ({drafts.length})</p>
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {drafts.map((ev) => (
                  <li key={ev._key} className="flex items-start justify-between gap-3 border border-zinc-200 px-3 py-2">
                    <div>
                      <p className="font-medium text-zinc-900">{ev.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {ev.status === 'awaiting_pick'
                          ? `Pick: ${(ev.date_options || []).map(formatLongDate).join(' · ')}`
                          : ev.date
                            ? formatLongDate(ev.date)
                            : 'No date'}
                        {ev.time ? ` · ${ev.time}` : ''}
                        {ev.category ? ` · ${ev.category}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-zinc-400 hover:text-zinc-800 shrink-0"
                      aria-label={`Remove ${ev.title}`}
                      onClick={() => removeDraft(ev._key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <fieldset className="space-y-2">
                <legend className="text-xs uppercase tracking-widest text-zinc-500">Import mode</legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                  />
                  Replace existing events
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                  />
                  Add to existing events
                </label>
              </fieldset>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-none" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-none"
            disabled={importing || drafts.length === 0}
            onClick={handleImport}
          >
            {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Import {drafts.length ? `${drafts.length} event(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
