import { Device } from '../api'

interface Props {
  devices: Device[]
  loading: boolean
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

export default function DevicesPanel({ devices, loading }: Props) {
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
                {['Device ID', 'Chrome Profile', 'IP Address', 'First Seen', 'Last Seen'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wide px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d._id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400 max-w-[180px] truncate">
                    {d.deviceId}
                  </td>
                  <td className="px-6 py-3.5 text-slate-300 text-xs">
                    {d.chromeProfileName || '—'}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">
                    {d.ipAddress || '—'}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                    {fmtDate(d.firstSeen)}
                  </td>
                  <td className="px-6 py-3.5 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isRecent(d.lastSeen) ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      />
                      <span className={isRecent(d.lastSeen) ? 'text-slate-300' : 'text-slate-500'}>
                        {fmtDate(d.lastSeen)}
                      </span>
                    </div>
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
