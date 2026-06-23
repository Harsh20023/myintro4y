import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ITRFormSelector } from '@/components/tools/ITRFormSelector'

export const metadata: Metadata = {
  title: 'ITR Form Selector — Conceptra',
  description: 'Answer a few questions and find the right ITR form to file your return.',
}

export default function Page() {
  return (
    <ToolLayout title="ITR Form Selector" description="Answer a few questions and find the right ITR form to file your return." breadcrumb="ITR Form Selector">
      <ITRFormSelector />
    </ToolLayout>
  )
}
