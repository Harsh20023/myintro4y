# Conceptra Admin Panel — web-admin

Next.js 13+ App Router · Tailwind CSS · TypeScript  
Superadmin-only panel for managing Conceptra platform data.

## API

All calls go through `src/lib/api.ts`.  
Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`, prod `https://gstapi.conceptra.co.in`).  
Auth: JWT stored in `localStorage('admin_token')`, sent as `Authorization: Bearer <token>`.  
Only `role === 'superadmin'` users can access the dashboard.

## Directory structure

```
src/
  app/
    login/page.tsx                    # Email/password login, redirects to /dashboard
    dashboard/
      layout.tsx                      # Sidebar nav + auth guard (checks /auth/me on mount)
      page.tsx                        # Overview — user stat cards
      users/
        page.tsx                      # Paginated user table, create user, membership assignment
        tree/page.tsx                 # Visual user hierarchy tree
      hsn/page.tsx                    # HSN/SAC code search (master database)
      public-access/page.tsx          # Toggle: require login to use public tools
      tax-config/page.tsx             # Sync compiled tax config to live (per tax year)
      tax-rates/page.tsx              # Tax rates management
      tds/
        codes/page.tsx                # TDS/TCS codes CRUD
        code-years/page.tsx           # Code years (rate slabs per year)
        schedules/page.tsx            # Schedules (slab / rates_in_force)
      gst/
        rule-sets/page.tsx            # GST rule sets list
        rule-sets/[id]/page.tsx       # Rule set detail: late-fee rules, interest rules, waivers
      services/
        page.tsx                      # Services CMS — categories + services list
        [slug]/page.tsx               # Service page editor: hero, sections, blocks
  lib/api.ts                          # All API functions + TypeScript types
  styles/globals.css
```

## Sidebar sections

| Label | Routes | Key API |
|---|---|---|
| Overview | `/dashboard` | `GET /users/stats` |
| Users | `/dashboard/users`, `/users/tree` | `GET/POST /users`, `GET/POST/DELETE /memberships` |
| HSN / SAC | `/dashboard/hsn` | `GET /hsn` |
| TDS/TCS | `/dashboard/tds/codes`, `/code-years`, `/schedules` | `GET/POST/PUT/DELETE /tds/*` |
| GST | `/dashboard/gst/rule-sets` | `GET/POST/PATCH/DELETE /rule-sets`, sub-array endpoints |
| Settings → Public Access | `/dashboard/public-access` | `GET/PATCH /config/tools-access` |
| Settings → Services | `/dashboard/services`, `/services/[slug]` | `GET/POST/PATCH/DELETE /services/*` |
| TDS → Sync to Live | `/dashboard/tax-config` | `GET /tax-config/latest`, `POST /tax-config/sync` |

## Key data models

**UserRecord** — `_id, email, role ('user'|'superadmin'), accountType ('individual'|'professional'|'organization'), displayName?, firmName?, membershipNumber?, orgName?, pan?, gstin?, phone?, isVerified, has_hrms_account, createdAt`

**MembershipRecord** — links `memberId (UserRecord)` → `targetId (UserRecord)`.  
Rules: individual can be assigned to org or professional; org can be assigned to professional.

**RuleSet** — `effectiveFrom, effectiveTo, notification, lateFeeRules[], interestRules[], waivers[]`  
Each sub-array has its own POST/DELETE endpoint: `/rule-sets/:id/late-fee-rules`, `/interest-rules`, `/waivers`

**HsnCodeRecord** — `hsnCode, type ('HSN'|'SAC'), description, chapterNumber, parentCode, currentRate, taxDetails[], active`

**ServicePageData** — `heroTitle, heroSubtitle, heroCTAText, overviewText, eligibilityText, sections[]`  
Section types: `STEPS | BENEFITS | DOCUMENTS_REQUIRED | FAQ | PRICING | WHY_US | COMPARISON_TABLE | CUSTOM`  
Block types: `STEP | LIST_ITEM | FAQ_ITEM | PRICING_CARD | TABLE_ROW | TEXT`

## Patterns to follow when adding new pages

1. New route goes under `src/app/dashboard/`.
2. Add a nav entry in `dashboard/layout.tsx` (top `navItems`, or a new accordion).
3. All API functions go in `src/lib/api.ts` — keep the same `req<T>()` + `authHeaders()` pattern.
4. Protect mutating calls with `headers: authHeaders()`.
5. No separate auth check needed in individual pages — the layout handles it.
