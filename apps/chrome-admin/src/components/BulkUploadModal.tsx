import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { credentialsApi } from '../api'

interface ParsedRow {
  clientName: string
  gstin: string
  siteUrl: string
  username: string
  password: string
}

interface Props {
  onClose: () => void
  onDone: (msg: string) => void
  onError: (msg: string) => void
}

export default function BulkUploadModal({ onClose, onDone, onError }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: { clientName: string; reason: string }[] } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setRows([])
    setResult(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }) as unknown[][]

        // Find the header row by looking for 'party name' or 'user id'
        let headerIdx = -1
        const colMap: Record<string, number> = {}

        for (let i = 0; i < raw.length; i++) {
          const row = raw[i]
          if (!Array.isArray(row)) continue
          const normalized = row.map(c => String(c ?? '').trim().toLowerCase())
          if (normalized.some(h => h === 'party name' || h === 'user id')) {
            headerIdx = i
            normalized.forEach((h, j) => {
              if (h === 'party name')              colMap.clientName = j
              if (h === 'gstn')                  colMap.gstin = j
              if (['link', 'url', 'site url', 'portal', 'portal url', 'website'].includes(h)) colMap.siteUrl = j
              if (h === 'user id')               colMap.username = j
              if (h === 'password')              colMap.password = j
            })
            break
          }
        }

        if (headerIdx === -1) {
          setParseError('Could not find header row. Make sure the sheet has "Party Name" and "USER ID" columns.')
          return
        }

        if (colMap.clientName === undefined || colMap.username === undefined || colMap.password === undefined) {
          setParseError('Missing required columns: Party Name, USER ID, or Password.')
          return
        }

        const parsed: ParsedRow[] = []
        for (let i = headerIdx + 1; i < raw.length; i++) {
          const row = raw[i]
          if (!Array.isArray(row)) continue
          const clientName = String(row[colMap.clientName] ?? '').trim()
          const gstin      = String(row[colMap.gstin]      ?? '').trim()
          const siteUrl    = colMap.siteUrl !== undefined ? String(row[colMap.siteUrl] ?? '').trim() : ''
          const username   = String(row[colMap.username]   ?? '').trim()
          const password   = String(row[colMap.password]   ?? '').trim()
          if (!clientName && !username) continue // skip blank rows
          parsed.push({ clientName, gstin, siteUrl, username, password })
        }

        if (parsed.length === 0) {
          setParseError('No data rows found after the header row.')
          return
        }

        setRows(parsed)
      } catch (err) {
        setParseError('Failed to parse file: ' + (err as Error).message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleUpload() {
    setUploading(true)
    try {
      const res = await credentialsApi.bulk(rows)
      setResult(res)
      if (res.errors.length === 0) {
        onDone(`${res.created} credential${res.created !== 1 ? 's' : ''} uploaded successfully`)
        onClose()
      }
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const hasIssues = rows.some(r => !r.clientName || !r.username || !r.password)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-white font-semibold">Bulk Upload Credentials</h2>
            <p className="text-slate-500 text-xs mt-0.5">Accepts .xls or .xlsx — needs columns: Party Name, GSTN, USER ID, Password</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors group"
          >
            <div className="text-3xl mb-2">📂</div>
            <p className="text-slate-400 group-hover:text-slate-200 text-sm transition-colors">
              Click to choose an Excel file (.xls / .xlsx)
            </p>
            {fileRef.current?.files?.[0] && (
              <p className="text-blue-400 text-xs mt-1">{fileRef.current.files[0].name}</p>
            )}
            <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={handleFile} className="hidden" />
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="px-4 py-3 rounded-lg bg-red-950 border border-red-900 text-red-400 text-sm">
              {parseError}
            </div>
          )}

          {/* Upload result with partial errors */}
          {result && result.errors.length > 0 && (
            <div className="px-4 py-3 rounded-lg bg-amber-950/50 border border-amber-800 text-amber-300 text-sm space-y-1">
              <p className="font-semibold">{result.created} uploaded, {result.errors.length} failed:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-amber-400">• {e.clientName}: {e.reason}</p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                  Preview — {rows.length} rows found
                </p>
                {hasIssues && (
                  <span className="text-xs text-amber-400 bg-amber-950/50 border border-amber-800 px-2 py-1 rounded-full">
                    ⚠ Rows with missing fields will be skipped
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/50">
                      {['#', 'Party Name', 'GSTN', 'USER ID', 'Password', 'Status'].map(h => (
                        <th key={h} className="text-left text-slate-500 font-semibold uppercase tracking-wide px-4 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const missing = !r.clientName || !r.username || !r.password
                      return (
                        <tr key={i} className={`border-b border-slate-700/50 ${missing ? 'bg-red-950/20' : ''}`}>
                          <td className="px-4 py-2 text-slate-600">{i + 1}</td>
                          <td className={`px-4 py-2 font-medium ${!r.clientName ? 'text-red-400' : 'text-white'}`}>
                            {r.clientName || '⚠ missing'}
                          </td>
                          <td className="px-4 py-2 text-slate-400 font-mono">{r.gstin || '—'}</td>
                          <td className={`px-4 py-2 font-mono ${!r.username ? 'text-red-400' : 'text-slate-300'}`}>
                            {r.username || '⚠ missing'}
                          </td>
                          <td className={`px-4 py-2 font-mono ${!r.password ? 'text-red-400' : 'text-slate-500'}`}>
                            {r.password ? '••••••' : '⚠ missing'}
                          </td>
                          <td className="px-4 py-2">
                            {missing
                              ? <span className="text-red-400">Skip</span>
                              : <span className="text-emerald-400">✓ Ready</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={rows.length === 0 || uploading}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-95"
          >
            {uploading
              ? 'Uploading…'
              : rows.length > 0
                ? `Upload ${rows.filter(r => r.clientName && r.username && r.password).length} credentials`
                : 'Choose a file first'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
