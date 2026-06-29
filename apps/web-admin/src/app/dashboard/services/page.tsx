'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import {
  servicesApi,
  type ServiceCategory,
  type Service,
  type CategoryWithServices,
} from '@/lib/api'

const blankCat = { name: '', slug: '', icon: '', displayOrder: 0, isVisible: true }
const blankSvc = { name: '', slug: '', shortDescription: '', icon: '', displayOrder: 0, isActive: true, metaTitle: '', metaDescription: '' }

function autoSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function ServicesPage() {
  const [data, setData]               = useState<CategoryWithServices[]>([])
  const [loading, setLoading]         = useState(true)
  const [toast, setToast]             = useState('')
  const [saving, setSaving]           = useState(false)

  const [showAddCat, setShowAddCat]   = useState(false)
  const [addCatForm, setAddCatForm]   = useState(blankCat)
  const [editingCat, setEditingCat]   = useState<string | null>(null)
  const [editCatForm, setEditCatForm] = useState(blankCat)

  const [addingSvcCat, setAddingSvcCat]   = useState<string | null>(null)
  const [addSvcForm, setAddSvcForm]       = useState(blankSvc)
  const [editingSvc, setEditingSvc]       = useState<string | null>(null)
  const [editSvcForm, setEditSvcForm]     = useState({ ...blankSvc, categoryId: '' })

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function load() {
    try {
      setData(await servicesApi.getCategories())
    } catch {
      flash('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Category ──────────────────────────────────────────────────────────────

  async function createCat() {
    if (!addCatForm.name || !addCatForm.slug) return
    setSaving(true)
    try {
      await servicesApi.createCategory(addCatForm)
      setShowAddCat(false); setAddCatForm(blankCat)
      await load(); flash('Category created')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function updateCat(id: string) {
    setSaving(true)
    try {
      await servicesApi.updateCategory(id, editCatForm)
      setEditingCat(null)
      await load(); flash('Category updated')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function deleteCat(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      await servicesApi.deleteCategory(id)
      await load(); flash('Category deleted')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
  }

  // ── Service ───────────────────────────────────────────────────────────────

  async function createSvc(categoryId: string) {
    if (!addSvcForm.name || !addSvcForm.slug) return
    setSaving(true)
    try {
      await servicesApi.createService({ ...addSvcForm, categoryId })
      setAddingSvcCat(null); setAddSvcForm(blankSvc)
      await load(); flash('Service created')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function updateSvc(id: string) {
    setSaving(true)
    try {
      await servicesApi.updateService(id, editSvcForm)
      setEditingSvc(null)
      await load(); flash('Service updated')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function deleteSvc(id: string) {
    if (!confirm('Delete this service?')) return
    try {
      await servicesApi.deleteService(id)
      await load(); flash('Service deleted')
    } catch (e) { flash(e instanceof Error ? e.message : 'Error') }
  }

  if (loading) return <div className="p-8"><p className="text-sm text-gray-400">Loading…</p></div>

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage service categories and pages shown on your website.</p>
        </div>
        <button
          onClick={() => { setShowAddCat(true); setEditingCat(null) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition"
        >
          <Plus size={14} /> New Category
        </button>
      </div>

      {toast && (
        <div className="mb-4 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 inline-block">
          {toast}
        </div>
      )}

      {/* Add category form */}
      {showAddCat && (
        <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-3">New Category</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input value={addCatForm.name}
                onChange={e => setAddCatForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                className={input} placeholder="Company Registration" />
            </Field>
            <Field label="Slug">
              <input value={addCatForm.slug}
                onChange={e => setAddCatForm(f => ({ ...f, slug: e.target.value }))}
                className={input} placeholder="company-registration" />
            </Field>
            <Field label="Icon (optional)">
              <input value={addCatForm.icon}
                onChange={e => setAddCatForm(f => ({ ...f, icon: e.target.value }))}
                className={input} placeholder="building-2" />
            </Field>
            <Field label="Display Order">
              <input type="number" value={addCatForm.displayOrder}
                onChange={e => setAddCatForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                className={input} />
            </Field>
          </div>
          <Buttons onSave={createCat} onCancel={() => { setShowAddCat(false); setAddCatForm(blankCat) }} saving={saving} />
        </div>
      )}

      {/* Category list */}
      <div className="space-y-4">
        {data.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400">No categories yet. Create one above.</p>
          </div>
        )}

        {data.map(cat => (
          <div key={cat._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Category row */}
            {editingCat === cat._id ? (
              <div className="p-4 bg-slate-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name">
                    <input value={editCatForm.name}
                      onChange={e => setEditCatForm(f => ({ ...f, name: e.target.value }))}
                      className={input} />
                  </Field>
                  <Field label="Slug">
                    <input value={editCatForm.slug}
                      onChange={e => setEditCatForm(f => ({ ...f, slug: e.target.value }))}
                      className={input} />
                  </Field>
                  <Field label="Icon">
                    <input value={editCatForm.icon}
                      onChange={e => setEditCatForm(f => ({ ...f, icon: e.target.value }))}
                      className={input} />
                  </Field>
                  <Field label="Display Order">
                    <input type="number" value={editCatForm.displayOrder}
                      onChange={e => setEditCatForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                      className={input} />
                  </Field>
                </div>
                <Buttons onSave={() => updateCat(cat._id)} onCancel={() => setEditingCat(null)} saving={saving} />
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 text-sm">{cat.name}</span>
                  <span className="text-xs text-gray-400 font-mono">/{cat.slug}</span>
                  {!cat.isVisible && <Badge>Hidden</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <IconBtn onClick={() => { setEditingCat(cat._id); setEditCatForm({ name: cat.name, slug: cat.slug, icon: cat.icon ?? '', displayOrder: cat.displayOrder, isVisible: cat.isVisible }) }}>
                    <Pencil size={13} />
                  </IconBtn>
                  <IconBtn danger onClick={() => deleteCat(cat._id)}>
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              </div>
            )}

            {/* Services */}
            <div className="divide-y divide-gray-100">
              {cat.services.map(svc => (
                <div key={svc._id}>
                  {editingSvc === svc._id ? (
                    <div className="px-5 py-4 bg-slate-50">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Name">
                          <input value={editSvcForm.name}
                            onChange={e => setEditSvcForm(f => ({ ...f, name: e.target.value }))}
                            className={input} />
                        </Field>
                        <Field label="Slug">
                          <input value={editSvcForm.slug}
                            onChange={e => setEditSvcForm(f => ({ ...f, slug: e.target.value }))}
                            className={input} />
                        </Field>
                        <Field label="Short Description" className="col-span-2">
                          <input value={editSvcForm.shortDescription}
                            onChange={e => setEditSvcForm(f => ({ ...f, shortDescription: e.target.value }))}
                            className={input} />
                        </Field>
                        <Field label="Meta Title">
                          <input value={editSvcForm.metaTitle}
                            onChange={e => setEditSvcForm(f => ({ ...f, metaTitle: e.target.value }))}
                            className={input} />
                        </Field>
                        <Field label="Display Order">
                          <input type="number" value={editSvcForm.displayOrder}
                            onChange={e => setEditSvcForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                            className={input} />
                        </Field>
                      </div>
                      <Buttons onSave={() => updateSvc(svc._id)} onCancel={() => setEditingSvc(null)} saving={saving} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm text-gray-800 truncate">{svc.name}</span>
                        <span className="text-xs text-gray-400 font-mono shrink-0">/{svc.slug}</span>
                        {!svc.isActive && <Badge>Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <Link href={`/dashboard/services/${svc.slug}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                          Edit Page <ChevronRight size={11} />
                        </Link>
                        <IconBtn onClick={() => {
                          setEditingSvc(svc._id)
                          setEditSvcForm({ name: svc.name, slug: svc.slug, shortDescription: svc.shortDescription ?? '', icon: svc.icon ?? '', displayOrder: svc.displayOrder, isActive: svc.isActive, categoryId: svc.categoryId, metaTitle: svc.metaTitle ?? '', metaDescription: svc.metaDescription ?? '' })
                        }}>
                          <Pencil size={13} />
                        </IconBtn>
                        <IconBtn danger onClick={() => deleteSvc(svc._id)}>
                          <Trash2 size={13} />
                        </IconBtn>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add service form */}
              {addingSvcCat === cat._id && (
                <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
                  <p className="text-xs font-semibold text-gray-700 mb-3">New Service in {cat.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name">
                      <input value={addSvcForm.name}
                        onChange={e => setAddSvcForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                        className={input} placeholder="Private Limited Company" />
                    </Field>
                    <Field label="Slug">
                      <input value={addSvcForm.slug}
                        onChange={e => setAddSvcForm(f => ({ ...f, slug: e.target.value }))}
                        className={input} placeholder="private-limited-company" />
                    </Field>
                    <Field label="Short Description" className="col-span-2">
                      <input value={addSvcForm.shortDescription}
                        onChange={e => setAddSvcForm(f => ({ ...f, shortDescription: e.target.value }))}
                        className={input} placeholder="Brief description shown in the navigation menu" />
                    </Field>
                  </div>
                  <Buttons onSave={() => createSvc(cat._id)} onCancel={() => { setAddingSvcCat(null); setAddSvcForm(blankSvc) }} saving={saving} saveLabel="Add Service" />
                </div>
              )}

              {addingSvcCat !== cat._id && (
                <button
                  onClick={() => { setAddingSvcCat(cat._id); setAddSvcForm(blankSvc) }}
                  className="w-full flex items-center gap-1.5 px-5 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                >
                  <Plus size={12} /> Add Service
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared micro-components ───────────────────────────────────────────────────

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white'

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{children}</span>
}

function IconBtn({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`p-1.5 rounded-lg transition ${danger ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
      {children}
    </button>
  )
}

function Buttons({ onSave, onCancel, saving, saveLabel = 'Save' }: { onSave: () => void; onCancel: () => void; saving: boolean; saveLabel?: string }) {
  return (
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
  )
}
