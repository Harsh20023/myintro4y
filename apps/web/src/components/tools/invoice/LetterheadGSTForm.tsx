'use client'

import { InvoiceData, InvoiceItem } from '@/lib/logic/invoice'
import RetailGSTForm from './RetailGSTForm'

interface Props {
  data: InvoiceData
  set: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void
  updateItem: (id: string, field: keyof InvoiceItem, value: string | number) => void
  addItem: () => void
  removeItem: (id: string) => void
}

export default function LetterheadGSTForm({ data, set, updateItem, addItem, removeItem }: Props) {
  return (
    <div className="space-y-4">
      {/* ── LETTERHEAD UPLOAD ── */}
      <div className="border rounded-xl p-3 bg-white shadow-sm border-slate-200 space-y-3">
        <p className="font-bold text-xs uppercase tracking-wider text-slate-700">0. Letter Head</p>
        <p className="text-[11px] text-slate-400">
          Upload your letterhead image — it will appear at the top of the invoice replacing the default title bar.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = ev => set('letterheadImage', ev.target?.result as string)
            reader.readAsDataURL(file)
          }}
          className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
        />
        {data.letterheadImage && (
          <div className="flex items-center gap-3">
            <img
              src={data.letterheadImage}
              alt="Letterhead"
              className="h-14 max-w-[220px] object-contain border border-slate-200 rounded"
            />
            <button
              type="button"
              onClick={() => set('letterheadImage', '')}
              className="text-[11px] text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* ── REST OF FORM (identical to Retail GST) ── */}
      <RetailGSTForm
        data={data}
        set={set}
        updateItem={updateItem}
        addItem={addItem}
        removeItem={removeItem}
      />
    </div>
  )
}
