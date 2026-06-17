import { decrypt } from './crypto'

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? ''

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('chrome_admin_token') ?? ''
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function handle<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}))
  if (r.status === 401) {
    localStorage.removeItem('chrome_admin_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!r.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${r.status}`)
  return data as T
}

interface EncryptedCredential {
  id: string
  clientName: string
  gstin: string
  siteUrl: string
  encryptedUsername: string
  usernameIv: string
  usernameAuthTag: string
  encryptedPassword: string
  passwordIv: string
  passwordAuthTag: string
  createdAt: string
  updatedAt: string
}

export interface Credential {
  id: string
  clientName: string
  gstin: string
  siteUrl: string
  username: string
  password: string
  createdAt: string
  updatedAt: string
}

export interface Device {
  _id: string
  deviceId: string
  chromeProfileName: string
  browserInfo: string
  ipAddress: string
  blocked: boolean
  firstSeen: string
  lastSeen: string
}

export const authApi = {
  login: (username: string, password: string, totpCode: string) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, totpCode }),
    }).then(r => handle<{ token: string }>(r)),
}

export const credentialsApi = {
  list: async (): Promise<Credential[]> => {
    const raw = await fetch(`${API_BASE}/api/admin/credentials`, { headers: authHeaders() })
      .then(r => handle<EncryptedCredential[]>(r))
    return Promise.all(raw.map(async c => ({
      id: c.id,
      clientName: c.clientName,
      gstin: c.gstin,
      siteUrl: c.siteUrl,
      username: await decrypt(c.encryptedUsername, c.usernameIv, c.usernameAuthTag),
      password: await decrypt(c.encryptedPassword, c.passwordIv, c.passwordAuthTag),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })))
  },

  add: (body: { clientName: string; gstin: string; siteUrl: string; username: string; password: string }) =>
    fetch(`${API_BASE}/api/admin/credentials`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(r => handle<{ id: string }>(r)),

  update: (
    id: string,
    body: Partial<{ clientName: string; gstin: string; siteUrl: string; username: string; password: string }>
  ) =>
    fetch(`${API_BASE}/api/admin/credentials/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(r => handle<{ success: boolean }>(r)),

  remove: (id: string) =>
    fetch(`${API_BASE}/api/admin/credentials/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(r => handle<{ success: boolean }>(r)),

  bulk: (credentials: { clientName: string; gstin: string; siteUrl: string; username: string; password: string }[]) =>
    fetch(`${API_BASE}/api/admin/credentials/bulk`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ credentials }),
    }).then(r => handle<{ created: number; errors: { clientName: string; reason: string }[] }>(r)),
}

export const devicesApi = {
  list: () =>
    fetch(`${API_BASE}/api/admin/devices`, { headers: authHeaders() })
      .then(r => handle<Device[]>(r)),

  kick: (id: string) =>
    fetch(`${API_BASE}/api/admin/devices/${id}/kick`, {
      method: 'POST',
      headers: authHeaders(),
    }).then(r => handle<{ success: boolean }>(r)),

  restore: (id: string) =>
    fetch(`${API_BASE}/api/admin/devices/${id}/restore`, {
      method: 'POST',
      headers: authHeaders(),
    }).then(r => handle<{ success: boolean }>(r)),
}
