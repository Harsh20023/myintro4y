import { useState } from 'react'
import { Credential, credentialsApi } from '../api'
import EditCredentialModal from './EditCredentialModal'
import BulkUploadModal from './BulkUploadModal'

interface Props {
  credentials: Credential[]
  loading: boolean
  onRefresh: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

export default function CredentialsPanel({ credentials, loading, onRefresh, onSuccess, onError }: Props) {
  const [editing, setEditing] = useState<Credential | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ clientName: '', gstin: '', username: '', password: '' })
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({})

  function togglePass(id: string) {
    setShowPassMap(m => ({ ...m, [id]: !m[id] }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName.trim() || !form.username.trim() || !form.password) {
      onError('Client name, username, and password are required')
      return
    }
    setAdding(true)
    try {
      await credentialsApi.add(form)
      setForm({ clientName: '', gstin: '', username: '', password: '' })
      onSuccess('Credential added')
      onRefresh()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(c: Credential) {
    if (!confirm(`Delete "${c.clientName}"?`)) return
    try {
      await credentialsApi.remove(c.id)
      onSuccess('Deleted')
      onRefresh()
    } catch (err) {
      onError((err as Error).message)
    }
  }

  return (
    <>
      <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold">GST Credentials</h2>
            <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800 px-2.5 py-1 rounded-full font-semibold">
              {loading ? '…' : credentials.length}
            </span>
          </div>
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:border-blue-600 hover:text-blue-400 text-xs font-medium transition-colors"
          >
            📂 Bulk Upload
          </button>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="px-6 py-4 border-b border-slate-700 bg-slate-900/40">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">Add New</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Client Name *"
              value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="GSTIN (optional)"
              value={form.gstin}
              onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Username *"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className={inputCls}
            />
            <input
              type="password"
              placeholder="Password *"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-95"
          >
            {adding ? 'Adding…' : '+ Add Credential'}
          </button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : credentials.length === 0 ? (
            <p className="text-center text-slate-600 py-12 text-sm">No credentials yet. Add one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Client', 'GSTIN', 'Username', 'Password', 'Updated', ''].map(h => (
                    <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wide px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {credentials.map(c => (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5 text-white font-medium whitespace-nowrap">{c.clientName}</td>
                    <td className="px-6 py-3.5 text-slate-400 font-mono text-xs">{c.gstin || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-300 font-mono text-xs">{c.username}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${showPassMap[c.id] ? 'text-slate-300' : 'text-slate-600 tracking-widest'}`}>
                          {showPassMap[c.id] ? c.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePass(c.id)}
                          className="text-slate-600 hover:text-slate-400 transition-colors text-xs"
                          title={showPassMap[c.id] ? 'Hide' : 'Show'}
                        >
                          {showPassMap[c.id] ? '🙈' : '👁'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(c.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(c)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-blue-600 hover:text-blue-400 text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-600 hover:border-red-900 hover:text-red-400 text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {editing && (
        <EditCredentialModal
          credential={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { onSuccess('Saved'); onRefresh() }}
          onError={onError}
        />
      )}

      {showBulk && (
        <BulkUploadModal
          onClose={() => setShowBulk(false)}
          onDone={msg => { onSuccess(msg); onRefresh() }}
          onError={onError}
        />
      )}
    </>
  )
}

const inputCls =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors'
