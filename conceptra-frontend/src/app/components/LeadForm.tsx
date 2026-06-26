'use client';
import { useState } from 'react';
import { Mail, Phone, Clock, MapPin, CheckCircle } from 'lucide-react';

const CONTACT_ITEMS = [
  {
    icon: Phone,
    title: 'Call Anytime',
    content: ['+91-8010450004', '+91-8800733236'],
    href: ['tel:+918010450004', 'tel:+918800733236'],
  },
  {
    icon: Mail,
    title: 'Email Address',
    content: ['conceptra.advisory@gmail.com'],
    href: ['mailto:conceptra.advisory@gmail.com'],
  },
  {
    icon: Clock,
    title: 'Operational Hours',
    content: ['Monday – Friday', '09:30 AM – 06:30 PM'],
    href: [null, null],
  },
  {
    icon: MapPin,
    title: 'Location',
    content: ['Gurugram, Haryana, India'],
    href: [null],
  },
];

const SERVICE_OPTIONS = [
  'Startup Advisory & Company Formation',
  'Taxation Compliances (Direct/Indirect)',
  'Payroll Systems & Management',
  'Outsourcing & Auditing Services',
  'Virtual CFO & Advisory Services',
  'General Financial Management',
];

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Get In Touch
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mt-4">
            Connect With Our Advisory Desk
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Our values are our guiding principles. We hold ourselves to the highest professional standards — doing business fairly, honestly, and transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: contact info */}
          <div className="lg:col-span-2 space-y-4">
            {CONTACT_ITEMS.map(({ icon: Icon, title, content, href }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">{title}</h4>
                  {content.map((line, i) => (
                    href[i] ? (
                      <a key={i} href={href[i]!} className="block text-sm text-slate-600 hover:text-teal-600 transition">
                        {line}
                      </a>
                    ) : (
                      <p key={i} className="text-sm text-slate-600">{line}</p>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3 bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {submitted ? (
              <div className="text-center space-y-5 py-16 relative z-10">
                <div className="w-16 h-16 bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Requirement Captured!</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out to Conceptra Advisory LLP. A specialized partner will review your requirements and connect back shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm text-teal-400 underline font-medium hover:text-teal-300 transition"
                >
                  Submit another query
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Find Your Solution</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide your business details to route your inquiry to the right specialized desk.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Rahul Sharma"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="corporate@yourfirm.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service Required</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 focus:outline-none focus:border-teal-500 text-sm transition">
                    {SERVICE_OPTIONS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brief Overview</label>
                  <textarea
                    rows={3}
                    placeholder="Please provide any relevant details about your requirements..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3.5 rounded-xl text-sm transition uppercase tracking-wider shadow-lg shadow-teal-500/10"
                >
                  Submit to Advisory Desk
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
