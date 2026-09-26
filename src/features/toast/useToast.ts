import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from './toastContext'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}

export type { ToastTone } from './toastContext'
