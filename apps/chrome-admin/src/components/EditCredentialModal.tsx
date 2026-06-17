import { useState } from 'react'
import { Credential, credentialsApi } from '../api'

interface Props {
  credential: Credential
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export default function EditCredentialModal({ credential, onClose, onSaved, onError }: Props) {
  const [clientName, setClientName] = useState(credential.clientName)
  const [gstin, setGstin] = useState(credential.gstin)
  const [siteUrl, setSiteUrl] = useState(credential.siteUrl)
  const [username, setUsername] = useState(credential.username)
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim() || !username.trim()) {
      onError('Client name and username are required')
      return
    }
    setSaving(true)
    try {
      const body: Parameters<typeof credentialsApi.update>[1] = { clientName, gstin, siteUrl, username }
      if (password) body.password = password
      await credentialsApi.update(credential.id, body)
      onSaved()
      onClose()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Edit Credential</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <Field label="Client Name *">
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="GSTIN (optional)">
            <input
              type="text"
              value={gstin}
              onChange={e => setGstin(e.target.value)}
              className={inputCls}
              placeholder="22AAAAA0000A1Z5"
            />
          </Field>

          <Field label="Portal URL">
            <input
              type="url"
              value={siteUrl}
              onChange={e => setSiteUrl(e.target.value)}
              className={inputCls}
              placeholder="https://services.gst.gov.in/services/login"
            />
          </Field>

          <Field label="Username *">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="New Password">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className={inputCls + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-95"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors'
