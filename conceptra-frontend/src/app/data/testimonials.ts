export type Testimonial = {
  name: string;
  company: string;
  role: string;
  review: string;
  rating: number;
  initials: string;
  color: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Rohit Mehra',
    company: 'TechNest Solutions Pvt Ltd',
    role: 'Founder & CEO',
    review:
      "Conceptra made our company incorporation seamless. From DIN to GST, they handled everything in under 2 weeks. Professional team, zero follow-ups needed.",
    rating: 5,
    initials: 'RM',
    color: 'bg-blue-600',
  },
  {
    name: 'Priya Sharma',
    company: 'Aura Retail Ventures',
    role: 'Director',
    review:
      "We outsourced our complete accounts function to Conceptra. MIS reports are on time every month and the CA team is always reachable. Highly recommend.",
    rating: 5,
    initials: 'PS',
    color: 'bg-emerald-600',
  },
  {
    name: 'Arjun Kapoor',
    company: 'K&A Exports',
    role: 'Managing Partner',
    review:
      "Transfer pricing and FEMA compliance were areas I dreaded. The advisory team at Conceptra simplified it completely. They know their domain inside out.",
    rating: 5,
    initials: 'AK',
    color: 'bg-violet-600',
  },
  {
    name: 'Sunita Bhatia',
    company: 'Greenpath Organics',
    role: 'Co-Founder',
    review:
      "Our statutory audit was completed ahead of schedule with zero discrepancies. The team is thorough, responsive, and reasonably priced for the quality delivered.",
    rating: 5,
    initials: 'SB',
    color: 'bg-amber-600',
  },
];
