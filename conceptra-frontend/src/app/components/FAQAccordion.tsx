'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Block { _id: string; title?: string; body?: string }

export default function FAQAccordion({ blocks }: { blocks: Block[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-2 max-w-3xl">
      {blocks.map((blk) => (
        <div
          key={blk._id}
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--ca-border)', background: 'white' }}
        >
          <button
            onClick={() => setOpen(open === blk._id ? null : blk._id)}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
            style={{ backgroundColor: open === blk._id ? 'var(--ca-primary-light)' : '' }}
            onMouseEnter={(e) => {
              if (open !== blk._id)
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--ca-bg-soft)';
            }}
            onMouseLeave={(e) => {
              if (open !== blk._id)
                (e.currentTarget as HTMLElement).style.backgroundColor = '';
            }}
          >
            <span className="font-semibold pr-4 text-sm" style={{ color: 'var(--ca-text)' }}>
              {blk.title}
            </span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open === blk._id ? 'rotate-180' : ''}`}
              style={{ color: 'var(--ca-primary)' }}
            />
          </button>
          {open === blk._id && (
            <div
              className="px-5 pb-4 pt-3 text-sm leading-relaxed border-t"
              style={{ color: 'var(--ca-muted)', borderColor: 'var(--ca-border)' }}
            >
              {blk.body}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
