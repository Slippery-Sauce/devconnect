import { useNavigate } from 'react-router-dom'

export default function Topbar({ title, onMenuClick, showBack = false, trailing }) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 h-14 gap-3 flex-shrink-0">

      {showBack ? (
        <button onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xl flex items-center">
          ←
        </button>
      ) : (
        <button onClick={onMenuClick}
          className="flex flex-col gap-1 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Open menu">
          <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
          <span className="block w-3.5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
          <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
        </button>
      )}

      {!showBack && <div className="hidden lg:block w-9" />}

      <h1 className="flex-1 text-center text-base font-black text-gray-900 dark:text-white tracking-tight">
        {title}
      </h1>

      {/* Trailing — bell always on the right */}
      <div className="flex items-center justify-end gap-2 min-w-[36px]">
        {trailing ?? <div className="w-9" />}
      </div>
    </div>
  )
}