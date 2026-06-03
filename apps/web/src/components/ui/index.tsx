import { forwardRef } from 'react'
import { clsx } from 'clsx'

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="label-base">{label}</label>}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3.5 text-ink-400 text-sm select-none pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'input-base',
              prefix && 'pl-8',
              suffix && 'pr-12',
              error && 'border-red-300 focus:ring-red-400',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3.5 text-ink-400 text-sm select-none pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ── Select ─────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, id, className, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="label-base">{label}</label>}
      <select
        id={selectId}
        className={clsx('input-base appearance-none cursor-pointer', className)}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, id, className, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={textareaId} className="label-base">{label}</label>}
      <textarea
        id={textareaId}
        className={clsx('input-base resize-none', className)}
        {...props}
      />
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-ink-100 shadow-sm',
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-5 md:p-6',
      padding === 'lg' && 'p-6 md:p-8',
      className
    )}>
      {children}
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-ink-100 my-4" />
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-ink-100" />
      <span className="text-xs text-ink-400 font-medium">{label}</span>
      <hr className="flex-1 border-ink-100" />
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'brand'
}) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variant === 'default' && 'bg-ink-100 text-ink-600',
      variant === 'success' && 'bg-green-50 text-green-700 border border-green-100',
      variant === 'warning' && 'bg-amber-50 text-amber-700 border border-amber-100',
      variant === 'brand'   && 'bg-brand-50 text-brand-700 border border-brand-100',
    )}>
      {children}
    </span>
  )
}
