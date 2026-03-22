import { useState, useCallback } from 'react'

let externalSetToasts = null

// Call this from anywhere — no React context needed
export function toast(message, type = 'success') {
  if (externalSetToasts) {
    const id = Date.now() + Math.random()
    externalSetToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      externalSetToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3300)
  }
}

export function useToastProvider() {
  const [toasts, setToasts] = useState([])
  externalSetToasts = setToasts
  return toasts
}
