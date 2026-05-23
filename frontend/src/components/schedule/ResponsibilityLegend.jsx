import { getPersonColor } from '@/lib/responsibilityColors'

export default function ResponsibilityLegend({ parties }) {
  if (!parties?.length) return null

  return (
    <div
      className="responsibility-legend flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-zinc-200"
      data-testid="responsibility-legend"
    >
      <span className="text-[0.65rem] uppercase tracking-widest text-zinc-500 w-full sm:w-auto sm:mr-2">
        On-site
      </span>
      {parties.map((name) => {
        const c = getPersonColor(name)
        return (
          <span key={name} className="inline-flex items-center gap-1.5 text-xs text-zinc-700 font-body">
            <span
              className="inline-block w-3 h-3 shrink-0 border border-zinc-300/80"
              style={{ background: c.bg }}
              aria-hidden
            />
            {name}
          </span>
        )
      })}
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 font-body">
        <span
          className="inline-block w-3 h-3 shrink-0 border border-zinc-300/80"
          style={{
            background: 'linear-gradient(to right, #e0e7ff 50%, #fef3c7 50%)',
          }}
          aria-hidden
        />
        Two parties
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-zinc-600 font-body">
        <span className="font-display font-semibold text-zinc-500">?</span>
        Awaiting preference
      </span>
    </div>
  )
}
