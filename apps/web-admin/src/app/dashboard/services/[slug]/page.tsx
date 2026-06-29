'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Pencil, ChevronDown, Eye, EyeOff, Save } from 'lucide-react'
import {
  servicesApi,
  type Service,
  type ServicePageData,
  type PageSection,
  type PageBlock,
  type SectionType,
  type BlockType,
} from '@/lib/api'

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'STEPS',              label: 'Steps / Process' },
  { value: 'BENEFITS',           label: 'Benefits' },
  { value: 'DOCUMENTS_REQUIRED', label: 'Documents Required' },
  { value: 'FAQ',                label: 'FAQ' },
  { value: 'PRICING',            label: 'Pricing' },
  { value: 'WHY_US',             label: 'Why Choose Us' },
  { value: 'COMPARISON_TABLE',   label: 'Comparison Table' },
  { value: 'CUSTOM',             label: 'Custom' },
]

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: 'STEP',         label: 'Step' },
  { value: 'LIST_ITEM',    label: 'List Item' },
  { value: 'FAQ_ITEM',     label: 'FAQ Item' },
  { value: 'PRICING_CARD', label: 'Pricing Card' },
  { value: 'TABLE_ROW',    label: 'Table Row' },
  { value: 'TEXT',         label: 'Text Block' },
]

const blankBlock   = { type: 'LIST_ITEM' as BlockType, title: '', body: '', icon: '', displayOrder: 0 }
const blankSection = { type: 'STEPS' as SectionType, heading: '', displayOrder: 0 }
const blankPage    = { heroTitle: '', heroSubtitle: '', heroCTAText: '', overviewText: '', eligibilityText: '' }

const inp  = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white'
const inpS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white'

export default function ServicePageEditor() {
  const params = useParams()
  const slug   = params.slug as string

  const [service, setService]   = useState<Service | null>(null)
  const [spData, setSpData]     = useState<ServicePageData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')

  const [pageForm, setPageForm]     = useState(blankPage)
  const [savingPage, setSavingPage] = useState(false)

  const [showAddSec, setShowAddSec]   = useState(false)
  const [addSecForm, setAddSecForm]   = useState(blankSection)
  const [savingSec, setSavingSec]     = useState(false)
  const [expandedSecs, setExpandedSecs] = useState<Set<string>>(new Set())

  const [showAddBlock, setShowAddBlock]   = useState<string | null>(null)
  const [addBlockForm, setAddBlockForm]   = useState(blankBlock)
  const [editingBlock, setEditingBlock]   = useState<{ sectionId: string; blockId: string } | null>(null)
  const [editBlockForm, setEditBlockForm] = useState(blankBlock)
  const [savingBlock, setSavingBlock]     = useState(false)

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    servicesApi.getServiceBySlug(slug)
      .then(({ service: svc, page }) => {
        setService(svc)
        setSpData(page)
        if (page) {
          setPageForm({
            heroTitle:      page.heroTitle      ?? '',
            heroSubtitle:   page.heroSubtitle   ?? '',
            heroCTAText:    page.heroCTAText    ?? '',
            overviewText:   page.overviewText   ?? '',
            eligibilityText:page.eligibilityText ?? '',
          })
        }
      })
      .catch(() => flash('Failed to load service'))
      .finally(() => setLoading(false))
  }, [slug])

  function toggleSec(id: string) {
    setExpandedSecs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Page settings ─────────────────────────────────────────────────────────

  async function savePage() {
    if (!service) return
    setSavingPage(true)
    try {
      const page = await servicesApi.upsertPage(service._id, pageForm)
      setSpData(page)
      flash('Page settings saved')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSavingPage(false) }
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  async function addSection() {
    if (!service || !addSecForm.heading) return
    setSavingSec(true)
    try {
      const page = await servicesApi.addSection(service._id, addSecForm)
      setSpData(page)
      setShowAddSec(false); setAddSecForm(blankSection)
      flash('Section added')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSavingSec(false) }
  }

  async function toggleVisibility(sec: PageSection) {
    if (!service) return
    try {
      const page = await servicesApi.updateSection(service._id, sec._id, { isVisible: !sec.isVisible })
      setSpData(page)
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
  }

  async function deleteSection(sectionId: string) {
    if (!service || !confirm('Delete this section and all its blocks?')) return
    try {
      const page = await servicesApi.deleteSection(service._id, sectionId)
      setSpData(page); flash('Section deleted')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
  }

  // ── Blocks ────────────────────────────────────────────────────────────────

  async function addBlock(sectionId: string) {
    if (!service) return
    setSavingBlock(true)
    try {
      const page = await servicesApi.addBlock(service._id, sectionId, addBlockForm)
      setSpData(page)
      setShowAddBlock(null); setAddBlockForm(blankBlock)
      flash('Block added')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSavingBlock(false) }
  }

  async function saveBlock(sectionId: string, blockId: string) {
    if (!service) return
    setSavingBlock(true)
    try {
      const page = await servicesApi.updateBlock(service._id, sectionId, blockId, editBlockForm)
      setSpData(page)
      setEditingBlock(null); flash('Block updated')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSavingBlock(false) }
  }

  async function deleteBlock(sectionId: string, blockId: string) {
    if (!service || !confirm('Delete this block?')) return
    try {
      const page = await servicesApi.deleteBlock(service._id, sectionId, blockId)
      setSpData(page); flash('Block deleted')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-8"><p className="text-sm text-gray-400">Loading…</p></div>

  if (!service) return (
    <div className="p-8">
      <Link href="/dashboard/services" className="text-sm text-slate-600 hover:underline">← Back to Services</Link>
      <p className="mt-4 text-sm text-red-500">Service not found.</p>
    </div>
  )

  const sections = (spData?.sections ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/services" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft size={14} /> Back to Services
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{service.name}</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">/{service.slug}</p>
        </div>
        {toast && (
          <div className="text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200">
            {toast}
          </div>
        )}
      </div>

      {/* ── Page Settings ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Page Settings</p>
          <p className="text-xs text-gray-400 mt-0.5">Hero banner and overview content</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Lbl label="Hero Title">
              <input value={pageForm.heroTitle}
                onChange={e => setPageForm(f => ({ ...f, heroTitle: e.target.value }))}
                className={inp} placeholder="Register Your Private Limited Company" />
            </Lbl>
            <Lbl label="Hero Subtitle">
              <input value={pageForm.heroSubtitle}
                onChange={e => setPageForm(f => ({ ...f, heroSubtitle: e.target.value }))}
                className={inp} placeholder="Fast, fully online, expert-assisted" />
            </Lbl>
            <Lbl label="CTA Button Text">
              <input value={pageForm.heroCTAText}
                onChange={e => setPageForm(f => ({ ...f, heroCTAText: e.target.value }))}
                className={inp} placeholder="Get Started" />
            </Lbl>
          </div>
          <Lbl label="Overview / What is it?">
            <textarea value={pageForm.overviewText}
              onChange={e => setPageForm(f => ({ ...f, overviewText: e.target.value }))}
              rows={4} className={`${inp} resize-none`}
              placeholder="A Private Limited Company is the most popular business structure in India…" />
          </Lbl>
          <Lbl label="Eligibility">
            <textarea value={pageForm.eligibilityText}
              onChange={e => setPageForm(f => ({ ...f, eligibilityText: e.target.value }))}
              rows={3} className={`${inp} resize-none`}
              placeholder="Minimum 2 directors, at least one must be an Indian resident…" />
          </Lbl>
          <button onClick={savePage} disabled={savingPage}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition disabled:opacity-50">
            <Save size={13} /> {savingPage ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Page Sections</p>
            <p className="text-xs text-gray-400 mt-0.5">{sections.length} section{sections.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowAddSec(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-700 transition">
            <Plus size={13} /> Add Section
          </button>
        </div>

        {/* Add section form */}
        {showAddSec && (
          <div className="px-5 py-4 bg-slate-50 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              <Lbl label="Type">
                <select value={addSecForm.type}
                  onChange={e => setAddSecForm(f => ({ ...f, type: e.target.value as SectionType }))}
                  className={inp}>
                  {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Lbl>
              <Lbl label="Section Heading" className="col-span-2">
                <input value={addSecForm.heading}
                  onChange={e => setAddSecForm(f => ({ ...f, heading: e.target.value }))}
                  className={inp} placeholder="How It Works" />
              </Lbl>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addSection} disabled={savingSec}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-700 disabled:opacity-50">
                {savingSec ? 'Adding…' : 'Add Section'}
              </button>
              <button onClick={() => { setShowAddSec(false); setAddSecForm(blankSection) }}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sections list */}
        <div className="divide-y divide-gray-100">
          {sections.length === 0 && !showAddSec && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No sections yet. Add one above.</p>
            </div>
          )}

          {sections.map(sec => (
            <div key={sec._id}>
              {/* Section header row */}
              <div className="flex items-center justify-between px-5 py-3">
                <button onClick={() => toggleSec(sec._id)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${expandedSecs.has(sec._id) ? 'rotate-180' : ''}`} />
                  <span className="text-sm font-medium text-gray-800 truncate">{sec.heading}</span>
                  <span className="shrink-0 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{sec.type}</span>
                  <span className="shrink-0 text-xs text-gray-400">{sec.blocks.length} block{sec.blocks.length !== 1 ? 's' : ''}</span>
                </button>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button onClick={() => toggleVisibility(sec)}
                    title={sec.isVisible ? 'Hide section' : 'Show section'}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    {sec.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => deleteSection(sec._id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Expanded: blocks */}
              {expandedSecs.has(sec._id) && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {sec.blocks.length === 0 && showAddBlock !== sec._id && (
                    <p className="px-10 py-4 text-xs text-gray-400">No blocks yet.</p>
                  )}

                  <div className="divide-y divide-gray-100">
                    {sec.blocks
                      .slice()
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map(blk => (
                        <div key={blk._id} className="px-10 py-3">
                          {editingBlock?.sectionId === sec._id && editingBlock?.blockId === blk._id ? (
                            <BlockForm
                              form={editBlockForm}
                              setForm={setEditBlockForm}
                              onSave={() => saveBlock(sec._id, blk._id)}
                              onCancel={() => setEditingBlock(null)}
                              saving={savingBlock}
                              inpCls={inpS}
                            />
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">{blk.type}</span>
                                  {blk.title && <span className="text-xs font-medium text-gray-800">{blk.title}</span>}
                                </div>
                                {blk.body && <p className="text-xs text-gray-500 line-clamp-2">{blk.body}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => {
                                  setEditingBlock({ sectionId: sec._id, blockId: blk._id })
                                  setEditBlockForm({ type: blk.type, title: blk.title ?? '', body: blk.body ?? '', icon: blk.icon ?? '', displayOrder: blk.displayOrder })
                                }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => deleteBlock(sec._id, blk._id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Add block form */}
                  {showAddBlock === sec._id && (
                    <div className="px-10 py-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-3">New Block</p>
                      <BlockForm
                        form={addBlockForm}
                        setForm={setAddBlockForm}
                        onSave={() => addBlock(sec._id)}
                        onCancel={() => { setShowAddBlock(null); setAddBlockForm(blankBlock) }}
                        saving={savingBlock}
                        saveLabel="Add Block"
                        inpCls={inpS}
                      />
                    </div>
                  )}

                  {showAddBlock !== sec._id && (
                    <button
                      onClick={() => { setShowAddBlock(sec._id); setAddBlockForm(blankBlock) }}
                      className="w-full flex items-center gap-1.5 px-10 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition border-t border-gray-100">
                      <Plus size={12} /> Add Block
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── BlockForm ─────────────────────────────────────────────────────────────────

type BlockFormState = { type: BlockType; title: string; body: string; icon: string; displayOrder: number }

function BlockForm({
  form, setForm, onSave, onCancel, saving, saveLabel = 'Save', inpCls,
}: {
  form: BlockFormState
  setForm: React.Dispatch<React.SetStateAction<BlockFormState>>
  onSave: () => void
  onCancel: () => void
  saving: boolean
  saveLabel?: string
  inpCls: string
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Lbl label="Type">
          <select value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as BlockType }))}
            className={inpCls}>
            {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Lbl>
        <Lbl label="Title">
          <input value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inpCls} placeholder="e.g. Step 1: Apply for DSC" />
        </Lbl>
        <Lbl label="Body" className="col-span-2">
          <textarea value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={3} className={`${inpCls} resize-none`}
            placeholder="Description or content for this block" />
        </Lbl>
        <Lbl label="Icon (optional)">
          <input value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            className={inpCls} placeholder="shield-check" />
        </Lbl>
        <Lbl label="Display Order">
          <input type="number" value={form.displayOrder}
            onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
            className={inpCls} />
        </Lbl>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onSave} disabled={saving}
          className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-700 disabled:opacity-50">
          {saving ? 'Saving…' : saveLabel}
        </button>
        <button onClick={onCancel}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  )
}

function Lbl({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}
