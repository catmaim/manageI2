import './globals.css';
import { LayoutDashboard, ClipboardList, ShieldCheck, Share2, Trophy } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'GGS2 Management Portal',
  description: 'ระบบบริหารงานสืบสวน กก.สส.2 บก.สส.ภ.8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className="flex flex-col md:flex-row min-h-screen">
          {/* Mobile Header (Side nav for desktop) */}
          <nav className="bg-[#001f3f] text-white w-full md:w-64 flex-shrink-0 flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
              <ShieldCheck className="text-yellow-500" size={32} />
              <div>
                <p className="font-bold text-lg leading-none text-yellow-500">GGS2</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Inv. Portal</p>
              </div>
            </div>
            <div className="flex-grow p-4 space-y-2">
              <NavLink href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              <NavLink href="/tasks" icon={<ClipboardList size={18} />} label="รายการงาน" />
              <NavLink href="/strategic-map" icon={<Share2 size={18} />} label="Mission Map" />
              <NavLink href="/ranking" icon={<Trophy size={18} />} label="Unit Ranking" />
            </div>
            <div className="p-4 border-t border-slate-700 text-center">
              <p className="text-[10px] text-slate-500 uppercase">System By Jake & Team</p>
            </div>
          </nav>
          <div className="flex-grow overflow-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">
      <span className="text-slate-400 group-hover:text-yellow-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
