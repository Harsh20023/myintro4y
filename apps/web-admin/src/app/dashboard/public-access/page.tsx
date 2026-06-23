'use client'

import { useEffect, useState } from 'react'
import { config } from '@/lib/api'

export default function PublicAccessPage() {
  const [requireLogin, setRequireLogin] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState('')

  useEffect(() => {
    config.getToolsAccess()
      .then(r => setRequireLogin(r.requireLogin))
      .finally(() => setLoading(false))
  }, [])

  async function save(value: boolean) {
    setSaving(true)
    setToast('')
    try {
      const r = await config.setToolsAccess(value)
      setRequireLogin(r.requireLogin)
      setToast('Saved')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(''), 2500)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Public Access</h1>
      <p className="text-sm text-gray-500 mb-6">Control whether visitors need to log in before using tools.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Require login to use tools</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  When on, visitors must sign in before accessing any free tool.
                </p>
              </div>
              <button
                onClick={() => save(!requireLogin)}
                disabled={saving}
                className={`relative w-11 h-6 rounded-full transition-colors ${requireLogin ? 'bg-slate-900' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${requireLogin ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className={`mt-4 text-xs font-medium px-3 py-2 rounded-lg inline-block ${
              requireLogin
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {requireLogin ? 'Tools are private — login required' : 'Tools are public — no login needed'}
            </div>

            {toast && (
              <p className={`mt-3 text-xs ${toast === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>{toast}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
