'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

function CallbackHandler() {
  const router             = useRouter()
  const searchParams       = useSearchParams()
  const { loginWithToken } = useAuth()
  const [error, setError]  = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const err   = searchParams.get('error')

    if (err) {
      setError('Google sign-in was cancelled or failed. Please try again.')
      return
    }

    if (!token) {
      setError('No token received. Please try again.')
      return
    }

    loginWithToken(token)
      .then(() => router.replace('/'))
      .catch(() => setError('Failed to complete sign-in. Please try again.'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <h2 className="font-display font-bold text-lg text-ink-900 mb-2">Sign-in failed</h2>
          <p className="text-sm text-ink-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap size={20} className="text-brand-600" />
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={15} className="animate-spin" />
          Completing sign-in…
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
