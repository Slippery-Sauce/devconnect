import { getInitials, getAvatarColor } from '../lib/utils'

export default function Avatar({ name = '', size = 36, className = '' }) {
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: getAvatarColor(name),
        fontSize: size * 0.37,
        letterSpacing: -0.5,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
