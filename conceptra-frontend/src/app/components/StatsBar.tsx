import { Users, Award, Briefcase, Clock } from 'lucide-react';

const STATS = [
  { icon: Users, value: '500+', label: 'Happy Clients', desc: 'businesses served across India' },
  { icon: Award, value: '10+', label: 'Years Experience', desc: 'in financial & advisory services' },
  { icon: Briefcase, value: '6+', label: 'Service Lines', desc: 'covering all compliance needs' },
  { icon: Clock, value: '100%', label: 'On-Time Filing', desc: 'deadline management guarantee' },
];

export default function StatsBar() {
  return (
    <section className="bg-white border-b border-slate-100 px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-100">
          {STATS.map(({ icon: Icon, value, label, desc }) => (
            <div key={label} className="text-center space-y-2 px-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-teal-600" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
              <p className="text-sm font-bold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
