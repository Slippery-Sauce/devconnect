export default function SkillTag({ skill, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
      {skill}
      {onRemove && (
        <button
          onClick={() => onRemove(skill)}
          className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 text-sm leading-none ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  )
}
