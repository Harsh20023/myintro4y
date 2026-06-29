const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data as T
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type AccountType = 'individual' | 'professional' | 'organization'

export interface AdminUser {
  id: string
  email: string
  role: 'user' | 'superadmin'
}

export interface UserRecord {
  _id: string
  email: string
  displayName?: string
  role: 'user' | 'superadmin'
  accountType: AccountType
  firmName?: string
  membershipNumber?: string
  orgName?: string
  pan?: string
  gstin?: string
  phone?: string
  isVerified: boolean
  has_hrms_account: boolean
  createdAt: string
  updatedAt: string
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    req<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    req<{ user: AdminUser }>('/auth/me', { headers: authHeaders() }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { page?: number; limit?: number; accountType?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page)        qs.set('page',        String(params.page))
    if (params?.limit)       qs.set('limit',       String(params.limit))
    if (params?.accountType) qs.set('accountType', params.accountType)
    if (params?.search)      qs.set('search',      params.search)
    const q = qs.toString()
    return req<{ users: UserRecord[]; total: number; page: number; limit: number; pages: number }>(
      `/users${q ? `?${q}` : ''}`,
      { headers: authHeaders() },
    )
  },
}

// ── Config ───────────────────────────────────────────────────────────────────

export const config = {
  getToolsAccess: () =>
    req<{ requireLogin: boolean }>('/config/tools-access'),

  setToolsAccess: (requireLogin: boolean) =>
    req<{ requireLogin: boolean }>('/config/tools-access', {
      method: 'PATCH',
      body: JSON.stringify({ requireLogin }),
      headers: authHeaders(),
    }),
}

// ── GST Rule Sets ─────────────────────────────────────────────────────────────

export interface TurnoverSlab {
  label: string
  lower: number
  upper: number | null
}

export interface LateFeeRule {
  _id?: string
  returnTypeCode: string
  returnTypeName: string
  frequency: 'monthly' | 'quarterly' | 'annual' | 'event'
  dueRuleType: 'dayOfFollowingMonth' | 'quarterly' | 'annual' | 'eventBased'
  dueParam: number | null
  turnoverSlab: TurnoverSlab
  isNil: boolean
  perDayCgst: number
  perDaySgst: number
  capType: 'flat' | 'percentOfTurnover' | 'none'
  capValue: number | null
}

export interface InterestRule {
  _id?: string
  type: 'latePayment' | 'excessItc'
  annualRate: number
  dayBasis: number
}

export interface Waiver {
  _id?: string
  returnTypeCode: string
  periodFrom: string
  periodTo: string
  fileBy: string
  overrideType: 'cap' | 'perDay' | 'full'
  overrideValue: number | null
}

export interface RuleSet {
  _id: string
  effectiveFrom: string
  effectiveTo: string | null
  notification: { number: string; title: string; url: string }
  lateFeeRules: LateFeeRule[]
  interestRules: InterestRule[]
  waivers: Waiver[]
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

type CreateRuleSetBody = Omit<RuleSet, '_id' | 'deletedAt' | 'createdAt' | 'updatedAt'>
type PatchRuleSetBody  = Partial<CreateRuleSetBody>

export const ruleSetsApi = {
  list: (params?: { effectiveOn?: string }) => {
    const qs = params?.effectiveOn ? `?effectiveOn=${params.effectiveOn}` : ''
    return req<RuleSet[]>(`/rule-sets${qs}`)
  },

  get: (id: string) =>
    req<RuleSet>(`/rule-sets/${id}`),

  create: (body: CreateRuleSetBody) =>
    req<RuleSet>('/rule-sets', {
      method: 'POST', body: JSON.stringify(body), headers: authHeaders(),
    }),

  update: (id: string, body: PatchRuleSetBody) =>
    req<RuleSet>(`/rule-sets/${id}`, {
      method: 'PATCH', body: JSON.stringify(body), headers: authHeaders(),
    }),

  remove: (id: string) =>
    req<{ message: string; id: string }>(`/rule-sets/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  // Sub-array operations
  pushLateFeeRule: (id: string, rule: Omit<LateFeeRule, '_id'>) =>
    req<RuleSet>(`/rule-sets/${id}/late-fee-rules`, {
      method: 'POST', body: JSON.stringify(rule), headers: authHeaders(),
    }),

  pullLateFeeRule: (id: string, ruleId: string) =>
    req<RuleSet>(`/rule-sets/${id}/late-fee-rules/${ruleId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  pushInterestRule: (id: string, rule: Omit<InterestRule, '_id'>) =>
    req<RuleSet>(`/rule-sets/${id}/interest-rules`, {
      method: 'POST', body: JSON.stringify(rule), headers: authHeaders(),
    }),

  pullInterestRule: (id: string, ruleId: string) =>
    req<RuleSet>(`/rule-sets/${id}/interest-rules/${ruleId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  pushWaiver: (id: string, waiver: Omit<Waiver, '_id'>) =>
    req<RuleSet>(`/rule-sets/${id}/waivers`, {
      method: 'POST', body: JSON.stringify(waiver), headers: authHeaders(),
    }),

  pullWaiver: (id: string, waiverId: string) =>
    req<RuleSet>(`/rule-sets/${id}/waivers/${waiverId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),
}

// ── TDS Codes ─────────────────────────────────────────────────────────────────

export interface TdsCode {
  _id: string
  code: string
  tax_type: 'TDS' | 'TCS'
  description: string
  deductor: string
  payee_type: string
  old_section: string
  new_section: string
}

export const tdsCodesApi = {
  list: () =>
    req<TdsCode[]>('/tds/codes'),

  get: (code: string) =>
    req<TdsCode>(`/tds/codes/${code}`),

  create: (body: Omit<TdsCode, '_id'>) =>
    req<TdsCode>('/tds/codes', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authHeaders(),
    }),

  update: (code: string, body: Partial<Omit<TdsCode, '_id' | 'code'>>) =>
    req<TdsCode>(`/tds/codes/${code}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: authHeaders(),
    }),

  remove: (code: string) =>
    req<{ message: string }>(`/tds/codes/${code}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
}

// ── TDS Code Years ────────────────────────────────────────────────────────────

export interface TdsCodeYear {
  _id: string
  code: string
  tax_year: string
  form: string
  source_note: string
  effective_from: string
  effective_to: string | null
  display_rate: string
  display_threshold: string
  rates_json: unknown[]
  thresholds_json: unknown[]
}

export const tdsCodeYearsApi = {
  list: (params?: { code?: string; tax_year?: string }) => {
    const qs = new URLSearchParams()
    if (params?.code)     qs.set('code', params.code)
    if (params?.tax_year) qs.set('tax_year', params.tax_year)
    const q = qs.toString()
    return req<TdsCodeYear[]>(`/tds/code-years${q ? `?${q}` : ''}`)
  },

  get: (id: string) =>
    req<TdsCodeYear>(`/tds/code-years/${id}`),

  create: (body: Omit<TdsCodeYear, '_id'>) =>
    req<TdsCodeYear>('/tds/code-years', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authHeaders(),
    }),

  update: (id: string, body: Partial<Omit<TdsCodeYear, '_id'>>) =>
    req<TdsCodeYear>(`/tds/code-years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: authHeaders(),
    }),

  remove: (id: string) =>
    req<{ message: string }>(`/tds/code-years/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
}

// ── TDS Schedules ─────────────────────────────────────────────────────────────

export interface TdsSchedule {
  _id: string
  ref: string
  kind: 'slab' | 'rates_in_force'
  regime: 'new' | 'old' | null
  tax_year: string
  legal_ref: string
  brackets_json: unknown[]
  rebate_note: string
  surcharge_note: string
}

export const tdsSchedulesApi = {
  list: (params?: { kind?: string; tax_year?: string; regime?: string }) => {
    const qs = new URLSearchParams()
    if (params?.kind)     qs.set('kind', params.kind)
    if (params?.tax_year) qs.set('tax_year', params.tax_year)
    if (params?.regime)   qs.set('regime', params.regime)
    const q = qs.toString()
    return req<TdsSchedule[]>(`/tds/schedules${q ? `?${q}` : ''}`)
  },

  get: (ref: string) =>
    req<TdsSchedule>(`/tds/schedules/${ref}`),

  create: (body: Omit<TdsSchedule, '_id'>) =>
    req<TdsSchedule>('/tds/schedules', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authHeaders(),
    }),

  update: (ref: string, body: Partial<Omit<TdsSchedule, '_id' | 'ref'>>) =>
    req<TdsSchedule>(`/tds/schedules/${ref}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: authHeaders(),
    }),

  remove: (ref: string) =>
    req<{ message: string }>(`/tds/schedules/${ref}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
}

// ── Tax Meta (Surcharge / Year) ────────────────────────────────────────────────

export const taxMetaApi = {
  getSurcharge: (taxYear: string, entityClass: string) =>
    req<any>(`/tax-meta/surcharge/${taxYear}/${entityClass}`),

  updateSurcharge: (taxYear: string, entityClass: string, body: object) =>
    req<any>(`/tax-meta/surcharge/${taxYear}/${entityClass}`, {
      method: 'PUT', body: JSON.stringify(body), headers: authHeaders(),
    }),

  getYear: (taxYear: string) =>
    req<any>(`/tax-meta/year/${taxYear}`),

  updateYear: (taxYear: string, body: object) =>
    req<any>(`/tax-meta/year/${taxYear}`, {
      method: 'PUT', body: JSON.stringify(body), headers: authHeaders(),
    }),
}

// ── Services CMS ─────────────────────────────────────────────────────────────

export interface ServiceCategory {
  _id: string
  name: string
  slug: string
  icon?: string
  displayOrder: number
  isVisible: boolean
}

export interface Service {
  _id: string
  categoryId: string
  name: string
  slug: string
  shortDescription?: string
  icon?: string
  displayOrder: number
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
}

export type SectionType = 'STEPS' | 'BENEFITS' | 'DOCUMENTS_REQUIRED' | 'FAQ' | 'PRICING' | 'WHY_US' | 'COMPARISON_TABLE' | 'CUSTOM'
export type BlockType   = 'STEP' | 'LIST_ITEM' | 'FAQ_ITEM' | 'PRICING_CARD' | 'TABLE_ROW' | 'TEXT'

export interface PageBlock {
  _id: string
  type: BlockType
  title?: string
  body?: string
  icon?: string
  displayOrder: number
}

export interface PageSection {
  _id: string
  type: SectionType
  heading: string
  displayOrder: number
  isVisible: boolean
  blocks: PageBlock[]
}

export interface ServicePageData {
  _id: string
  serviceId: string
  heroTitle?: string
  heroSubtitle?: string
  heroCTAText?: string
  overviewText?: string
  eligibilityText?: string
  sections: PageSection[]
}

export type CategoryWithServices = ServiceCategory & { services: Service[] }

export const servicesApi = {
  getCategories: () =>
    req<CategoryWithServices[]>('/services/categories'),

  getServiceBySlug: (slug: string) =>
    req<{ service: Service; page: ServicePageData | null }>(`/services/${slug}`),

  createCategory: (body: Omit<ServiceCategory, '_id'>) =>
    req<ServiceCategory>('/services/categories', {
      method: 'POST', body: JSON.stringify(body), headers: authHeaders(),
    }),

  updateCategory: (categoryId: string, body: Partial<Omit<ServiceCategory, '_id'>>) =>
    req<ServiceCategory>(`/services/categories/${categoryId}`, {
      method: 'PATCH', body: JSON.stringify(body), headers: authHeaders(),
    }),

  deleteCategory: (categoryId: string) =>
    req<{ message: string }>(`/services/categories/${categoryId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  createService: (body: Omit<Service, '_id'>) =>
    req<Service>('/services', {
      method: 'POST', body: JSON.stringify(body), headers: authHeaders(),
    }),

  updateService: (serviceId: string, body: Partial<Omit<Service, '_id'>>) =>
    req<Service>(`/services/${serviceId}`, {
      method: 'PATCH', body: JSON.stringify(body), headers: authHeaders(),
    }),

  deleteService: (serviceId: string) =>
    req<{ message: string }>(`/services/${serviceId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  upsertPage: (serviceId: string, body: Partial<Pick<ServicePageData, 'heroTitle' | 'heroSubtitle' | 'heroCTAText' | 'overviewText' | 'eligibilityText'>>) =>
    req<ServicePageData>(`/services/${serviceId}/page`, {
      method: 'PUT', body: JSON.stringify(body), headers: authHeaders(),
    }),

  addSection: (serviceId: string, body: { type: SectionType; heading: string; displayOrder?: number; isVisible?: boolean }) =>
    req<ServicePageData>(`/services/${serviceId}/page/sections`, {
      method: 'POST', body: JSON.stringify(body), headers: authHeaders(),
    }),

  updateSection: (serviceId: string, sectionId: string, body: Partial<Pick<PageSection, 'type' | 'heading' | 'displayOrder' | 'isVisible'>>) =>
    req<ServicePageData>(`/services/${serviceId}/page/sections/${sectionId}`, {
      method: 'PATCH', body: JSON.stringify(body), headers: authHeaders(),
    }),

  deleteSection: (serviceId: string, sectionId: string) =>
    req<ServicePageData>(`/services/${serviceId}/page/sections/${sectionId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  addBlock: (serviceId: string, sectionId: string, body: Omit<PageBlock, '_id'>) =>
    req<ServicePageData>(`/services/${serviceId}/page/sections/${sectionId}/blocks`, {
      method: 'POST', body: JSON.stringify(body), headers: authHeaders(),
    }),

  updateBlock: (serviceId: string, sectionId: string, blockId: string, body: Partial<Omit<PageBlock, '_id'>>) =>
    req<ServicePageData>(`/services/${serviceId}/page/sections/${sectionId}/blocks/${blockId}`, {
      method: 'PATCH', body: JSON.stringify(body), headers: authHeaders(),
    }),

  deleteBlock: (serviceId: string, sectionId: string, blockId: string) =>
    req<ServicePageData>(`/services/${serviceId}/page/sections/${sectionId}/blocks/${blockId}`, {
      method: 'DELETE', headers: authHeaders(),
    }),
}

// ── Tax Config ────────────────────────────────────────────────────────────────

export interface TaxConfigStatus {
  tax_year:    string
  version:     string
  compiled_at: string
}

export const taxConfigApi = {
  getLatest: (taxYear = '2026-27') =>
    req<{ data: TaxConfigStatus } | null>(`/tax-config/latest?tax_year=${taxYear}`)
      .catch(() => null),

  sync: (taxYear = '2026-27') =>
    req<{ message: string; tax_year: string; version: string; compiled_at: string }>(
      `/tax-config/sync?tax_year=${taxYear}`,
      { method: 'POST', headers: authHeaders() },
    ),
}
