import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Button({ className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 ${className}`}
    />
  )
}

export function GhostButton({ className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50 ${className}`}
    />
  )
}

export function Field({
  label,
  error,
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input {...p} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
      {error && <span className="mt-1 block text-red-600">{error}</span>}
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
}

export function ErrorText({ children }: { children?: ReactNode }) {
  return children ? <p role="alert" className="text-sm text-red-600">{children}</p> : null
}
