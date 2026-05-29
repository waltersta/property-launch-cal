import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STEPS = [
  'Toggle Admin at the top to edit your trial listing.',
  'Add or edit events on the timeline, or drag events on the calendar to reschedule.',
  'Use Copy link or Send link (in Transaction admin) to share the client view.',
  'Open Settings (05) for hero images and your New Event dropdown lists.',
]

export default function OnboardingDialog({ open, onOpenChange, agentName, onComplete }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-zinc-300 sm:max-w-md" data-testid="onboarding-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">
            Welcome{agentName ? `, ${agentName}` : ''}
          </DialogTitle>
          <DialogDescription className="font-body text-left">
            Your sample listing is ready. Here is how to try the app:
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal list-inside space-y-2 text-sm font-body text-zinc-700">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <DialogFooter>
          <Button className="rounded-none w-full sm:w-auto" onClick={onComplete}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
