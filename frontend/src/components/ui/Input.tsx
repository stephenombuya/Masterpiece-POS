import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils'

// ── Input ─────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, leftIcon, className, ...props
}, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white',
          'transition-colors duration-150',
          error ? 'border-danger-600 bg-danger-50' : 'border-gray-200',
          leftIcon && 'pl-9',
          className,
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-danger-600">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, options, placeholder, className, ...props
}, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
    <select
      ref={ref}
      className={cn(
        'w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white',
        'transition-colors duration-150',
        error ? 'border-danger-600' : 'border-gray-200',
        className,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-danger-600">{error}</p>}
  </div>
))
Select.displayName = 'Select'

// ── Textarea ──────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className, ...props
}, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
    <textarea
      ref={ref}
      rows={3}
      className={cn(
        'w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white',
        error ? 'border-danger-600' : 'border-gray-200',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-danger-600">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'
