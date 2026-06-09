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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  register: (email: string, password: string) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

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

export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'superadmin'
  has_hrms_account: boolean
}

export interface GSTNTaxpayer {
  flag: 'Y' | 'N'
  gstin?: string
  tradeNam?: string
  lgnm?: string
  stj?: string
  dty?: string
  ctb?: string
  sts?: string
  dtReg?: string
  rgdt?: string
  cxdt?: string
  lstupdt?: string
  nba?: string[]
  einvoiceStatus?: string
  pradr?: { adr: string; ntr: string }
  msg?: string
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
}
