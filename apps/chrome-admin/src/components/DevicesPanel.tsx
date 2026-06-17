import { useState } from 'react'
import { Device, devicesApi } from '../api'

interface Props {
  devices: Device[]
  loading: boolean
  onRefresh: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

function isRecent(date: string) {
  return Date.now() - new Date(date).getTime() < 24 * 60 * 60 * 1000
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DevicesPanel({ devices, loading, onRefresh, onSuccess, onError }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleKick(id: string, name: string) {
    setBusyId(id)
    try {
      await devicesApi.kick(id)
      onSuccess(`"${name}" has been kicked out`)
      onRefresh()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRestore(id: string, name: string) {
    setBusyId(id)
    try {
      await devicesApi.restore(id)
      onSuccess(`"${name}" access restored`)
      onRefresh()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2 className="text-white font-semibold">Connected Devices</h2>
        <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-800 px-2.5 py-1 rounded-full font-semibold">
          {loading ? '…' : devices.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : devices.length === 0 ? (
          <p className="text-center text-slate-600 py-12 text-sm">No devices registered yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Device ID', 'Chrome Profile', 'IP Address', 'Last Seen', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wide px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr
                  key={d._id}
                  className={`border-b border-slate-700/50 transition-colors ${
                    d.blocked ? 'bg-red-950/20' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400 max-w-[180px] truncate">
                    {d.deviceId}
                  </td>
                  <td className="px-6 py-3.5 text-slate-300 text-xs">
                    {d.chromeProfileName || '—'}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">
                    {d.ipAddress || '—'}
                  </td>
                  <td className="px-6 py-3.5 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isRecent(d.lastSeen) && !d.blocked ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      />
                      <span className={isRecent(d.lastSeen) && !d.blocked ? 'text-slate-300' : 'text-slate-500'}>
                        {fmtDate(d.lastSeen)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    {d.blocked ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-950/50 border border-red-900 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Kicked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {d.blocked ? (
                      <button
                        onClick={() => handleRestore(d._id, d.chromeProfileName || d.deviceId)}
                        disabled={busyId === d._id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-400 disabled:opacity-50 transition-colors"
                      >
                        {busyId === d._id ? '…' : 'Restore'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleKick(d._id, d.chromeProfileName || d.deviceId)}
                        disabled={busyId === d._id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/70 border border-red-800 text-red-400 disabled:opacity-50 transition-colors"
                      >
                        {busyId === d._id ? '…' : 'Kick out'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
