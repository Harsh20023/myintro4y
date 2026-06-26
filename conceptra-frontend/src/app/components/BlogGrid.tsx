'use client';
import { ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogs';

export default function BlogGrid() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: 'var(--ca-bg)' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: 'var(--ca-accent)', backgroundColor: 'var(--ca-accent-light)' }}
            >
              Knowledge Hub
            </span>
            <h2 className="text-3xl font-extrabold mt-3" style={{ color: 'var(--ca-primary)' }}>
              Recent Insights &amp; Guides
            </h2>
            <p className="text-sm text-[var(--ca-muted)] mt-1">Stay ahead with expert articles on tax, compliance, and business growth.</p>
          </div>
          <a
            href="#"
            className="flex-shrink-0 font-semibold text-sm px-5 py-2.5 rounded-full border-2 transition hover:opacity-80"
            style={{ borderColor: 'var(--ca-primary)', color: 'var(--ca-primary)' }}
          >
            View All Blogs
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BLOG_POSTS.map(({ category, title, excerpt, readTime }) => (
            <article
              key={title}
              className="border rounded-2xl p-5 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              style={{ borderColor: 'var(--ca-border)', backgroundColor: 'var(--ca-bg)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--ca-accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--ca-border)';
              }}
            >
              {/* Category badge */}
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4 w-fit"
                style={{ backgroundColor: 'var(--ca-primary-light)', color: 'var(--ca-primary)' }}
              >
                {category}
              </span>

              {/* Title */}
              <h4
                className="font-bold text-sm leading-snug flex-grow mb-3"
                style={{ color: 'var(--ca-primary)' }}
              >
                {title}
              </h4>

              {/* Excerpt */}
              <p className="text-xs text-[var(--ca-muted)] leading-relaxed mb-4">{excerpt}</p>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--ca-border)' }}>
                <span className="text-[10px] text-[var(--ca-muted)]">{readTime}</span>
                <a
                  href="#"
                  className="flex items-center gap-1 text-xs font-bold transition"
                  style={{ color: 'var(--ca-accent)' }}
                >
                  Read <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
