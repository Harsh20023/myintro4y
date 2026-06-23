import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { Form16Parser } from '@/components/tools/Form16Parser'

export const metadata: Metadata = {
  title: 'Form 16 / 16A Parser — Conceptra',
  description: 'Upload your Form 16 or 16A PDF to extract salary, TDS, and deduction details instantly. Download as Excel.',
}

export default function Page() {
  return (
    <ToolLayout
      title="Form 16 / 16A Parser"
      description="Upload Form 16 or 16A PDFs — extract employee details, salary figures, deductions, and TDS data. Download as Excel."
      breadcrumb="Form 16 / 16A Parser"
      badge="New"
    >
      <Form16Parser />
    </ToolLayout>
  )
}
