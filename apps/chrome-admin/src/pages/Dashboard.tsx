import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Credential, Device, credentialsApi, devicesApi } from '../api'
import CredentialsPanel from '../components/CredentialsPanel'
import DevicesPanel from '../components/DevicesPanel'
import Toast, { ToastType } from '../components/Toast'

interface ToastState {
  id: number
  message: string
  type: ToastType
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loadingCreds, setLoadingCreds] = useState(true)
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [toasts, setToasts] = useState<ToastState[]>([])

  function pushToast(message: string, type: ToastType = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  const loadCredentials = useCallback(async () => {
    setLoadingCreds(true)
    try {
      setCredentials(await credentialsApi.list())
    } catch (err) {
      pushToast((err as Error).message, 'error')
    } finally {
      setLoadingCreds(false)
    }
  }, [])

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true)
    try {
      setDevices(await devicesApi.list())
    } catch (err) {
      pushToast((err as Error).message, 'error')
    } finally {
      setLoadingDevices(false)
    }
  }, [])

  useEffect(() => {
    loadCredentials()
    loadDevices()
  }, [loadCredentials, loadDevices])

  function logout() {
    localStorage.removeItem('chrome_admin_token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-800/80 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base shrink-0">
              🔒
            </div>
            <span className="text-white font-bold text-base">Chrome GST Manager</span>
            <span className="text-slate-600 text-sm hidden sm:inline">/ Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadCredentials(); loadDevices() }}
              className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              title="Refresh"
            >
              ↻ Refresh
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-900 text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <CredentialsPanel
          credentials={credentials}
          loading={loadingCreds}
          onRefresh={loadCredentials}
          onSuccess={msg => pushToast(msg, 'success')}
          onError={msg => pushToast(msg, 'error')}
        />
        <DevicesPanel devices={devices} loading={loadingDevices} />
      </main>

      {/* Toasts */}
      {toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onDismiss={() => setToasts(ts => ts.filter(x => x.id !== t.id))}
        />
      ))}
    </div>
  )
}
