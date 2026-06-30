const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://gstapi.conceptra.co.in'

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type AccountType = 'individual' | 'professional' | 'organization'

export interface RegisterPayload {
  email: string
  password: string
  accountType: AccountType
  displayName?: string
  firmName?: string
  membershipNumber?: string
  orgName?: string
  pan?: string
  gstin?: string
  phone?: string
}

export const api = {
  register: (payload: RegisterPayload) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  verifyOtp: (email: string, otp: string) =>
    req<{ token: string }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),

  login: (email: string, password: string) =>
    req<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () =>
    req<{ user: AuthUser }>('/auth/me', { headers: authHeaders() }),

  getToolsAccess: () =>
    req<{ requireLogin: boolean }>('/config/tools-access'),

  setToolsAccess: (requireLogin: boolean) =>
    req<{ requireLogin: boolean }>('/config/tools-access', {
      method: 'PATCH',
      body: JSON.stringify({ requireLogin }),
      headers: authHeaders(),
    }),
}

// ── HSN / SAC ─────────────────────────────────────────────────────────────────

export interface HsnCodeRecord {
  _id: string
  hsnCode: string
  type: 'HSN' | 'SAC'
  description: string
  chapterNumber: string
  parentCode: string | null
  currentRate: number | null
  active: boolean
  deletedAt: string | null
}

export interface HsnListResponse {
  data: HsnCodeRecord[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const hsnApi = {
  list: (params?: { q?: string; chapter?: string; type?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.q)       qs.set('q',       params.q)
    if (params?.chapter) qs.set('chapter', params.chapter)
    if (params?.type)    qs.set('type',    params.type)
    if (params?.page)    qs.set('page',    String(params.page))
    if (params?.limit)   qs.set('limit',   String(params.limit))
    const q = qs.toString()
    return req<HsnListResponse>(`/hsn${q ? `?${q}` : ''}`)
  },
}

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  role: 'user' | 'superadmin'
  accountType: AccountType
  has_hrms_account: boolean
}

export interface GSTNTaxpayer {
  // success fields (present when GSTIN is found)
  gstin?: string
  tradeNam?: string
  lgnm?: string
  stj?: string
  ctj?: string
  dty?: string
  ctb?: string
  sts?: string
  dtReg?: string
  rgdt?: string
  cxdt?: string
  lstupdt?: string
  nba?: string[]
  einvoiceStatus?: string
  pradr?: { adr: string; ntr?: string }
  ntcrbs?: string
  adhrVFlag?: string
  ekycVFlag?: string
  cmpRt?: string
  isFieldVisitConducted?: string
  bzsdtls?: { saccd: string; sdes: string }[]
  filing?: GSTFilingData
  filingSessionId?: string
  // error fields (present when lookup fails)
  message?: string
  msg?: string
  errorCode?: string
}

export interface FilingEntry {
  fy:      string
  taxp:    string
  dof:     string
  sts:     string
  mof:     string
  rtntype: string
}

export interface FrequencyRow {
  fy:      string
  aprJun:  string
  julSep:  string
  octDec:  string
  janMar:  string
}

export interface GSTFilingData {
  mode?:      string
  gstr3b:     FilingEntry[]
  gstr1:      FilingEntry[]
  frequency?: FrequencyRow[]
}

export const gst = {
  getCaptcha: (gstin: string) =>
    req<{ captcha: string; sessionId: string }>('/gst/captcha', {
      method: 'POST',
      body: JSON.stringify({ gstin }),
    }),

  verify: (sessionId: string, captcha: string) =>
    req<GSTNTaxpayer>('/gst/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId, captcha }),
    }),

  getFilings: (filingSessionId: string, fy: string, mode: 'filing-table' | 'return-frequency') =>
    req<GSTFilingData>('/gst/filings', {
      method: 'POST',
      body: JSON.stringify({ filingSessionId, fy, mode }),
    }),
}

export interface PANResult {
  gstin: string
  sts:   string
  state: string
}

export const pan = {
  getCaptcha: (pan: string) =>
    req<{ captcha: string; sessionId: string }>('/gst/pan/captcha', {
      method: 'POST',
      body: JSON.stringify({ pan }),
    }),

  search: (sessionId: string, captcha: string) =>
    req<{ results: PANResult[] }>('/gst/pan/search', {
      method: 'POST',
      body: JSON.stringify({ sessionId, captcha }),
    }),
}

export interface GSTR1Data {
  gstin?:    string
  fp?:       string   // financial period e.g. "032026"
  b2b?:      { ctin: string; inv: { inum: string; idt: string; val: number; itms: { num: number; itm_det: { rt: number; txval: number; iamt?: number; camt?: number; samt?: number } }[] }[] }[]
  b2cs?:     { sply_ty: string; rt: number; txval: number; iamt?: number; camt?: number; samt?: number }[]
  hsn?:      { data: { hsn_sc: string; desc: string; uqc: string; qty: number; val: number; txval: number; iamt?: number; camt?: number; samt?: number }[] }
  doc_issue?: { doc_det: { doc_num: number; docs: { num: number; from: string; to: string; totnum: number; cancel: number; net_issue: number }[] }[] }
  exp?:      unknown[]
  nil?:      unknown
  raw?:      string   // fallback if not JSON
}

export const gstReturns = {
  getCaptcha: (username: string) =>
    req<{ captcha: string; sessionId: string }>('/gst/returns/captcha', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  login: (sessionId: string, username: string, password: string, captcha: string) =>
    req<{ success: boolean; sessionId: string }>('/gst/returns/login', {
      method: 'POST',
      body: JSON.stringify({ sessionId, username, password, captcha }),
    }),

  download: (sessionId: string, financialYear: string, period: string, returnType = 'GSTR-2B', format = 'excel') =>
    req<{ status?: string; jobId?: string; data?: GSTR1Data; base64?: string; filename: string; financialYear: string; period: string; isExcel?: boolean; isPDF?: boolean; message?: string }>('/gst/returns/download', {
      method: 'POST',
      body: JSON.stringify({ sessionId, financialYear, period, returnType, format }),
    }),

  checkDownload: (jobId: string) =>
    req<{ status: 'done' | 'generating'; base64?: string; filename?: string; financialYear?: string; period?: string; isExcel?: boolean; isPDF?: boolean; message?: string }>('/gst/returns/check', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    }),

  logout: (sessionId: string) =>
    req<{ success: boolean }>('/gst/returns/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
}
