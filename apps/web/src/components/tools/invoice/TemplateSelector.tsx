import { Select } from '@/components/ui'
import type { InvoiceTemplate } from './types'

interface Props {
  value: InvoiceTemplate
  onChange: (template: InvoiceTemplate) => void
}

export default function TemplateSelector({
  value,
  onChange,
}: Props) {
  return (
    <Select
      label="Invoice Template"
      value={value}
      options={[
        {
          value: 'classic-gst',
          label: 'Classic GST Invoice',
        },
        {
          value: 'service',
          label: 'Service Invoice',
        },
        {
          value: 'retail-gst',
          label: 'Retail GST Invoice',
        },
        {
          value: 'letterhead-gst',
          label: 'Invoice with Letter Head',
        },
      ]}
      onChange={(e) =>
        onChange(e.target.value as InvoiceTemplate)
      }
    />
  )
}