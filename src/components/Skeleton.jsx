export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="animate-shimmer rounded h-4 flex-1" />
        <div className="animate-shimmer rounded-full h-6 w-20 flex-shrink-0" />
      </div>
      <div className="animate-shimmer rounded h-3 w-full mb-1.5" />
      <div className="animate-shimmer rounded h-3 w-3/4 mb-3" />
      <div className="flex gap-1.5 mb-3">
        {[60, 80, 70].map((w, i) => (
          <div key={i} className="animate-shimmer rounded-full h-5" style={{ width: w }} />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="animate-shimmer rounded-full h-4 w-4" />
        <div className="animate-shimmer rounded h-3 w-32" />
      </div>
    </div>
  )
}

export function SkeletonText({ w = 'full', h = 4 }) {
  return (
    <div className={`animate-shimmer rounded w-${w} h-${h}`} />
  )
}
