# LedgerHQ

Free business tools for Indian SMBs — built to scale into a full SaaS platform.

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Monorepo**: Turborepo
- **Fonts**: DM Sans + Playfair Display + DM Mono

## Project Structure

```
apps/
  web/          → Next.js app (landing + tools)
    src/
      app/
        (marketing)/    → Landing page
        tools/
          invoice-generator/   → Tool #1
          gst-calculator/      → Tool #2
      components/
        layout/    → Navbar, Footer, ToolLayout
        ui/        → Input, Select, Card, Badge...
        tools/     → InvoiceGenerator, GSTCalculator
      lib/
        logic/     → Pure functions (invoice.ts, gst.ts, pdf.ts)
packages/
  types/         → Shared TypeScript types
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# App runs at http://localhost:3000
```

## Adding a New Tool

1. Add logic to `apps/web/src/lib/logic/yourtool.ts` (pure functions only)
2. Create component at `apps/web/src/components/tools/YourTool.tsx`
3. Create page at `apps/web/src/app/tools/your-tool/page.tsx`
4. Add to Navbar + Footer + landing page tools grid

## Monetization path

When a tool grows enough to gate:

1. Add a `requireFeature('tool_name_pro')` middleware to its API route
2. Create a Plan in the database that includes `tool_name_pro`
3. The free version remains — pro features (bulk, history, PDF branding removed) sit behind auth

The `ToolLayout` component already has the slot for an upgrade CTA — just pass `showUpgrade={true}`.

## Adding the backend later

```
apps/
  api/           → Fastify/Express + Prisma
    src/
      middleware/
        authenticate.ts
        resolveTenant.ts
        requireFeature.ts
      modules/
        auth/
        tools/
        billing/
prisma/
  schema.prisma
```

The frontend tools call no backend today. When you're ready to add "save history" or PDF without watermark, add an API route and update the tool component to call it when the user is logged in.
