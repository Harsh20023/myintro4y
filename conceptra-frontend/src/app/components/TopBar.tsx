import { Mail, Phone } from 'lucide-react';

export default function TopBar() {
  return (
    <div
      className="w-full text-white text-xs py-2 px-4"
      style={{ backgroundColor: 'var(--ca-primary-dark)' }}
    >
      <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-4">
        {/* Left — social */}
        <div className="flex items-center gap-3">
          {/* Instagram */}
          <a href="#" aria-label="Instagram" className="hover:opacity-70 transition">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.072 5.197.157 3.355.673 1.93 2.099.505 3.524-.01 5.366.072 7.222.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.086 1.856.602 3.698 2.028 5.123C3.524 23.495 5.366 24.01 7.222 23.928 8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.856-.086 3.698-.602 5.123-2.028 1.426-1.425 1.942-3.267 2.028-5.123C23.986 15.667 24 15.259 24 12s-.014-3.667-.072-4.947c-.086-1.856-.602-3.698-2.028-5.123C20.476.505 18.634-.01 16.778.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          </a>
          {/* LinkedIn */}
          <a href="#" aria-label="LinkedIn" className="hover:opacity-70 transition">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          {/* Facebook */}
          <a href="#" aria-label="Facebook" className="hover:opacity-70 transition">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>

        {/* Right — contact */}
        <div className="flex items-center gap-5">
          <a href="mailto:conceptra.advisory@gmail.com" className="hidden sm:flex items-center gap-1.5 hover:opacity-80 transition">
            <Mail className="w-3.5 h-3.5" />
            conceptra.advisory@gmail.com
          </a>
          <a href="tel:+918010450004" className="flex items-center gap-1.5 hover:opacity-80 transition">
            <Phone className="w-3.5 h-3.5" />
            +91-8010450004
          </a>
        </div>
      </div>
    </div>
  );
}
