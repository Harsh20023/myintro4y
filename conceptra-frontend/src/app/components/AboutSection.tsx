import { CheckCircle, Target, Eye, TrendingUp } from 'lucide-react';

const HIGHLIGHTS = [
  'Fresh & practical financial planning approach',
  'Customized service based on individual client data',
  'Innovative solutions to simplify workflows',
  'Vast industry experience & domain capability',
  'Dedicated team of CAs, CSs & MBA professionals',
  'Cost-effective outsourcing solutions',
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-slate-50 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Who We Are
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mt-4">
            About Conceptra Advisory LLP
          </h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-base leading-relaxed">
            A professionally managed organization engaged in rendering value-added financial services with a fresh and practical approach.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          {/* Left: description + highlights + CTA */}
          <div className="space-y-6">
            <p className="text-slate-600 leading-relaxed">
              With commercial acumen and analytical thinking, we have been offering cost-effective{' '}
              <strong className="text-slate-800">Financial Management</strong>,{' '}
              <strong className="text-slate-800">Accounting & Auditing</strong>, and{' '}
              <strong className="text-slate-800">Company Formation</strong> solutions to businesses across India.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Outsourcing your finance and accounting tasks to Conceptra Advisory lets you focus entirely on growth and profitability — while we manage compliance through our team of highly-qualified Chartered Accountants and MBA graduates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {HIGHLIGHTS.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
              >
                Talk to Our Experts
              </a>
            </div>
          </div>

          {/* Right: Vision / Mission / Approach cards */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Our Vision</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                To be reckoned as one of the most trusted service providers — cited as the example of quality by delivering excellence through technology and innovation.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Our Mission</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                To uphold the highest standards of Competence, Commitment, Confidentiality & Integrity — constantly striving to improve quality through continuous training and knowledge upgrading.
              </p>
            </div>

            <div className="bg-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-base">Our Approach</h3>
              </div>
              <p className="text-sm text-teal-100 leading-relaxed">
                We combine deep domain expertise with customized client-specific solutions, ensuring your business stays ahead of regulatory changes while remaining operationally lean.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
