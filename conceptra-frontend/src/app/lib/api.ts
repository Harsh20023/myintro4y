const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://gstapi.conceptra.co.in'

export interface ServiceItem {
  _id: string
  categoryId: string | { _id: string; name: string; slug: string }
  name: string
  slug: string
  shortDescription?: string
  displayOrder: number
  isActive: boolean
}

export interface ServiceCategory {
  _id: string
  name: string
  slug: string
  displayOrder: number
  isVisible: boolean
}

export type CategoryWithServices = ServiceCategory & { services: ServiceItem[] }

export type SectionType =
  | 'STEPS'
  | 'BENEFITS'
  | 'DOCUMENTS_REQUIRED'
  | 'FAQ'
  | 'PRICING'
  | 'WHY_US'
  | 'COMPARISON_TABLE'
  | 'CUSTOM'

export interface PageBlock {
  _id: string
  type: string
  title?: string
  body?: string
  displayOrder: number
  metadata?: Record<string, unknown>
}

export interface PageSection {
  _id: string
  type: SectionType
  heading: string
  displayOrder: number
  isVisible: boolean
  blocks: PageBlock[]
}

export interface ServicePageContent {
  heroTitle?: string
  heroSubtitle?: string
  heroCTAText?: string
  overviewText?: string
  eligibilityText?: string
  sections: PageSection[]
}

export async function getCategories(): Promise<CategoryWithServices[]> {
  try {
    const res = await fetch(`${BASE}/services/categories`, { cache: 'force-cache' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getServiceBySlug(
  slug: string
): Promise<{ service: ServiceItem; page: ServicePageContent | null } | null> {
  try {
    const res = await fetch(`${BASE}/services/${slug}`, { cache: 'force-cache' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
