export default function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex-shrink-0 transition-colors duration-200 rounded-full focus:outline-none"
      style={{
        width: 44,
        height: 24,
        background: on ? '#10b981' : '#d1d5db',
      }}
      aria-checked={on}
      role="switch"
    >
      <span
        className="absolute top-0.5 bg-white rounded-full shadow transition-all duration-200"
        style={{
          width: 20,
          height: 20,
          left: on ? 22 : 2,
        }}
      />
    </button>
  )
}
