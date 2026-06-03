// Shared types used across the platform
// As you add modules (CRM, HRMS, Payroll), their types go here

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Tenant context (populated by middleware on every authenticated request)
export interface TenantContext {
  id: string
  name: string
  plan: string
  features: string[]
}

// User context
export interface UserContext {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  tenantId: string
}
