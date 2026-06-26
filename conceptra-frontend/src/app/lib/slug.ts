import { NAV_DROPDOWNS } from '../data/navMenu';

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()&]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Flat map of slug → original display name (built once at module load)
const SLUG_MAP: Record<string, string> = {};
NAV_DROPDOWNS.forEach(({ columns }) =>
  columns.forEach(({ items }) =>
    items.forEach((item) => { SLUG_MAP[toSlug(item)] = item; })
  )
);

export function getServiceName(slug: string): string {
  return SLUG_MAP[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAllServiceSlugs(): { slug: string }[] {
  return Object.keys(SLUG_MAP).map((slug) => ({ slug }));
}
