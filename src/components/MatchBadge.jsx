import { scoreColor } from '../lib/utils'

export default function MatchBadge({ score, large = false }) {
  if (score === null || score === undefined) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full font-bold text-gray-500 ${large ? 'px-4 py-2 text-base' : 'px-2.5 py-1 text-xs'}`}>
        <span
          className="inline-block rounded animate-shimmer"
          style={{ width: large ? 28 : 18, height: large ? 6 : 5 }}
        />
        <span className="text-gray-400 text-xs">AI scoring…</span>
      </div>
    )
  }

  const c = scoreColor(score)

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${large ? 'px-4 py-2 text-base' : 'px-2.5 py-1 text-xs'}`}
      style={{
        background: c.bg,
        color: c.text,
        border: `1.5px solid ${c.border}`,
      }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: large ? 10 : 7,
          height: large ? 10 : 7,
          background: c.dot,
        }}
      />
      {score}% match
    </div>
  )
}
