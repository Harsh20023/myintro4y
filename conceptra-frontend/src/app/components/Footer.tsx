import { Shield, Phone, Mail, MapPin } from 'lucide-react';

const COL_LINKS = [
  {
    heading: 'Registrations',
    links: ['Private Limited Co.', 'One Person Company', 'LLP Registration', 'Section 8 Company', 'Partnership Firm'],
  },
  {
    heading: 'Compliances',
    links: ['GST Registration', 'Income Tax Filing', 'TDS / TCS Returns', 'PF & ESI Compliance', 'Startup India'],
  },
  {
    heading: 'Company',
    links: ['About Us', 'Services', 'Why Choose Us', 'Contact Us'],
  },
  {
    heading: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Disclaimer'],
  },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--ca-primary-dark)' }} className="text-white px-5 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">

          {/* Brand col */}
          <div className="lg:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="font-extrabold leading-tight text-sm">
                CONCEPTRA<br />
                <span className="font-normal opacity-60 text-xs">ADVISORY LLP</span>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Professionally managed organization delivering value-added financial management, accounting, auditing, and company formation services across India.
            </p>
            <div className="space-y-2 text-xs text-white/60">
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" />
                <div>
                  <a href="tel:+918010450004" className="hover:text-white transition block">+91-8010450004</a>
                  <a href="tel:+918800733236" className="hover:text-white transition block">+91-8800733236</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" />
                <a href="mailto:conceptra.advisory@gmail.com" className="hover:text-white transition break-all">
                  conceptra.advisory@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" />
                <span>Gurugram, Haryana, India</span>
              </div>
            </div>

            {/* Social */}
            {/* <div className="flex gap-2 pt-1">
              {['I', 'L', 'F', 'Y'].map((letter, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition"
                  aria-label={['Instagram', 'LinkedIn', 'Facebook', 'YouTube'][i]}
                >
                  {letter}
                </a>
              ))}
            </div> */}
          </div>

          {/* Link columns */}
          {COL_LINKS.map(({ heading, links }) => (
            <div key={heading} className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-white/60 hover:text-white transition">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/30">
          <p>© 2026 Conceptra Advisory LLP. All rights reserved.</p>
          <p>Professional financial &amp; advisory services across India.</p>
        </div>
      </div>
    </footer>
  );
}
