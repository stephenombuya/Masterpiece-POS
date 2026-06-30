import { type ReactNode, useEffect } from 'react'
import { cn } from '@/utils'
import { X } from 'lucide-react'
import { Button } from './Button'

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl shadow-card p-5', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

const badgeColors: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-600',
  danger:  'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-600',
  info:    'bg-primary-50 text-primary-700',
  neutral: 'bg-gray-100 text-gray-600',
}

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', badgeColors[variant])}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size]
  return (
    <svg className={cn('animate-spin text-primary-600', s)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full', modalSizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, icon, accent,
}: { label: string; value: string; sub?: string; icon?: ReactNode; accent?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl p-5 shadow-card',
      accent ? 'bg-primary-700 text-white' : 'bg-white',
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-xs font-semibold uppercase tracking-wide', accent ? 'text-primary-100' : 'text-gray-500')}>
            {label}
          </p>
          <p className={cn('text-2xl font-bold mt-1', accent ? 'text-white' : 'text-gray-900')}>
            {value}
          </p>
          {sub && <p className={cn('text-xs mt-1', accent ? 'text-primary-200' : 'text-gray-400')}>{sub}</p>}
        </div>
        {icon && (
          <div className={cn('p-2 rounded-lg', accent ? 'bg-primary-600' : 'bg-primary-50 text-primary-700')}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-3">{icon}</div>}
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-100', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-gray-700 border-t border-gray-50', className)}>
      {children}
    </td>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────
export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; danger?: boolean; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} size="sm" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
