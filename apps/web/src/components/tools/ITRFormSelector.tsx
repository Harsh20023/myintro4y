'use client'

import { useState, useMemo } from 'react'
import { Check, FileText, Info } from 'lucide-react'
import { Card } from '@/components/ui'
import { selectITRForm, ITR_QUESTIONS, type ITRAnswers } from '@/lib/logic/itr-selector'

const DEFAULT_ANSWERS: ITRAnswers = {
  isHUF: false, isNRI: false,
  hasSalary: false, hasBusinessIncome: false, isPresumed: false, isPartnerInFirm: false,
  hasCapitalGains: false, multipleHP: false, hasForeignAssets: false,
  incomeAbove50L: false, isDirector: false, holdsUnlisted: false, hasAgriAbove5K: false,
}

const FORM_COLORS: Record<string, string> = {
  brand:  'border-brand-300 bg-brand-50',
  violet: 'border-violet-300 bg-violet-50',
  amber:  'border-amber-300 bg-amber-50',
  teal:   'border-teal-300 bg-teal-50',
}
const FORM_TEXT: Record<string, string> = {
  brand:  'text-brand-700',
  violet: 'text-violet-700',
  amber:  'text-amber-700',
  teal:   'text-teal-700',
}
const FORM_ICON: Record<string, string> = {
  brand:  'bg-brand-100 text-brand-700',
  violet: 'bg-violet-100 text-violet-700',
  amber:  'bg-amber-100 text-amber-700',
  teal:   'bg-teal-100 text-teal-700',
}

// Group questions
function groupQuestions() {
  const groups = new Map<string, typeof ITR_QUESTIONS>()
  for (const q of ITR_QUESTIONS) {
    if (!groups.has(q.group)) groups.set(q.group, [])
    groups.get(q.group)!.push(q)
  }
  return groups
}
const QUESTION_GROUPS = groupQuestions()

export function ITRFormSelector() {
  const [answers, setAnswers] = useState<ITRAnswers>(DEFAULT_ANSWERS)

  const toggle = (key: keyof ITRAnswers) =>
    setAnswers(prev => ({ ...prev, [key]: !prev[key] }))

  const result = useMemo(() => selectITRForm(answers), [answers])
  const anyChecked = Object.values(answers).some(Boolean)

  const colorCard = FORM_COLORS[result.color] ?? FORM_COLORS.brand
  const colorText = FORM_TEXT[result.color]  ?? FORM_TEXT.brand
  const colorIcon = FORM_ICON[result.color]  ?? FORM_ICON.brand

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* Questions */}
      <div className="space-y-5">
        {Array.from(QUESTION_GROUPS.entries()).map(([group, questions]) => (
          <Card key={group}>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">{group}</p>
            <div className="space-y-2">
              {questions.map(q => {
                const checked = answers[q.key]
                return (
                  <button
                    key={q.key}
                    onClick={() => toggle(q.key)}
                    className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      checked
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      checked ? 'border-brand-500 bg-brand-500' : 'border-ink-300'
                    }`}>
                      {checked && <Check size={12} strokeWidth={3} className="text-white" />}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${checked ? 'text-brand-800' : 'text-ink-700'}`}>
                        {q.label}
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5">{q.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        ))}

        <div className="flex gap-2 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3">
          <Info size={14} className="text-ink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-ink-500">
            This tool covers <strong>Individuals and HUF</strong> filing ITR-1 through ITR-4.
            Companies, trusts, and LLPs file separate forms (ITR-5/6/7) and are out of scope.
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="lg:sticky lg:top-6 space-y-4">
        {/* Form recommendation */}
        <div className={`rounded-2xl border-2 p-6 ${colorCard}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorIcon}`}>
              <FileText size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Recommended form</p>
              <p className={`text-2xl font-bold ${colorText}`}>{result.name}</p>
            </div>
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">{result.desc}</p>
        </div>

        {/* Reasons */}
        {anyChecked && result.reasons.length > 0 && (
          <Card padding="sm">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">Why this form</p>
            <div className="space-y-2">
              {result.reasons.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${colorIcon}`}>
                    <Check size={9} strokeWidth={3} />
                  </span>
                  <p className="text-xs text-ink-600">{r}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Exclusions — why a simpler form doesn't apply */}
        {result.exclusions.length > 0 && (
          <Card padding="sm">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">
              Why you can't use a simpler form
            </p>
            <div className="space-y-2">
              {result.exclusions.map((e, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-0.5 text-red-400 shrink-0">×</span>
                  <p className="text-xs text-ink-600">{e}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Default state */}
        {!anyChecked && (
          <Card padding="sm" className="text-center py-4">
            <p className="text-xs text-ink-400">
              Check the boxes on the left that apply to your situation.
              The recommendation updates instantly.
            </p>
          </Card>
        )}

        {/* Quick reference */}
        <Card padding="sm">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">Quick reference</p>
          <div className="space-y-2 text-xs">
            {[
              { form: 'ITR-1', color: 'bg-brand-100 text-brand-700',  desc: 'Salary + 1 HP + simple income ≤ ₹50L' },
              { form: 'ITR-2', color: 'bg-violet-100 text-violet-700', desc: 'Capital gains / multiple HP / foreign assets / NRI' },
              { form: 'ITR-3', color: 'bg-amber-100 text-amber-700',   desc: 'Business/profession (non-presumptive), partners' },
              { form: 'ITR-4', color: 'bg-teal-100 text-teal-700',     desc: 'Presumptive business (44AD/44ADA/44AE) ≤ ₹50L' },
            ].map(item => (
              <div key={item.form} className="flex items-center gap-2">
                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${item.color}`}>
                  {item.form}
                </span>
                <span className="text-ink-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
