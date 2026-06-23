'use client'

import { Clock, Bell } from 'lucide-react'
import { useState } from 'react'

interface ComingSoonToolProps {
  title: string
  description: string
  category?: string
}

export function ComingSoonTool({ title, description, category }: ComingSoonToolProps) {
  const [notified, setNotified] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mb-6">
        <Clock size={28} className="text-ink-400" strokeWidth={1.5} />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100 mb-4">
        Coming Soon
      </div>

      <h2 className="font-display font-bold text-3xl md:text-4xl text-ink-900 mb-3 max-w-lg">
        {title} is on its way
      </h2>

      <p className="text-ink-500 text-base max-w-md leading-relaxed mb-10">
        {description} We&apos;re building this tool — it&apos;ll be free when it launches.
      </p>

      {!notified ? (
        <form
          onSubmit={e => { e.preventDefault(); if (email) setNotified(true) }}
          className="flex gap-2 w-full max-w-sm"
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <button
            type="submit"
            className="btn-primary text-sm px-5 flex items-center gap-1.5"
          >
            <Bell size={13} /> Notify me
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 px-5 py-3 bg-brand-50 border border-brand-100 rounded-xl text-brand-700 text-sm font-medium">
          <Bell size={14} /> You&apos;re on the list — we&apos;ll email you when it&apos;s ready.
        </div>
      )}

      {category && (
        <p className="mt-8 text-xs text-ink-400">
          Part of <span className="font-medium text-ink-500">{category}</span>
        </p>
      )}
    </div>
  )
}
