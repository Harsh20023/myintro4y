export type BlogPost = {
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    category: 'Company Formation',
    title: '5 Common Mistakes When Registering a Private Limited Company in India',
    excerpt: 'Avoid costly errors in the incorporation process — from DIN applications to MOA drafting.',
    readTime: '5 min read',
  },
  {
    category: 'Taxation',
    title: 'GST Compliance Checklist for FY 2026-27 — Everything You Need',
    excerpt: "A complete month-by-month filing calendar to keep your business GST-compliant all year.",
    readTime: '7 min read',
  },
  {
    category: 'Advisory',
    title: 'Private Limited vs LLP: Which Entity Structure is Right for Your Startup?',
    excerpt: 'Key differences in liability, taxation, compliance burden, and investment readiness — simplified.',
    readTime: '6 min read',
  },
  {
    category: 'Payroll',
    title: 'How Outsourcing Payroll Can Save Your Business Up to 30% in Overhead Costs',
    excerpt: 'A data-backed breakdown of hidden payroll costs vs. managed payroll service pricing.',
    readTime: '4 min read',
  },
];
