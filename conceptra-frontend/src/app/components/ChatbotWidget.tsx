'use client';
import { useState } from 'react';
import { MessageCircle, X, Bot, Clock } from 'lucide-react';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 bg-white animate-[fadeUp_0.2s_ease-out]">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: 'var(--ca-primary)' }}
          >
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-4 h-4" />
              <span className="font-semibold text-sm">Conceptra Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-6 flex flex-col items-center text-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--ca-primary-light)' }}
            >
              <Clock className="w-7 h-7" style={{ color: 'var(--ca-primary)' }} />
            </div>
            <p className="font-bold text-slate-800">AI Chatbot Coming Soon!</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Our smart assistant is on the way. Until then, our team is happy to help you directly.
            </p>
            <a
              href="mailto:conceptra.advisory@gmail.com"
              className="mt-1 w-full py-2.5 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: 'var(--ca-primary)' }}
            >
              Email Us Instead
            </a>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95"
        style={{ backgroundColor: 'var(--ca-primary)' }}
        aria-label="Open chat"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
