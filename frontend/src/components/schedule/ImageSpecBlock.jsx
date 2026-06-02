export default function ImageSpecBlock({ spec }) {
  return (
    <div className="mt-2 rounded-none border-2 border-stone-200 bg-stone-50 px-3 py-2.5 space-y-1.5">
      <p className="text-xs font-body text-zinc-700 leading-snug">{spec.summary}</p>
      <ul className="text-xs font-body text-zinc-600 leading-snug list-disc list-inside space-y-0.5">
        {spec.specs.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
