"use client";

import './globals.css';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShieldCheck, 
  Share2, 
  Trophy, 
  LogOut, 
  Calendar, 
  MessageSquare 
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <html lang="th">
      <body className="bg-slate-50">
        <AuthGuard>
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* Sidebar Navigation */}
            <nav className="bg-[#800000] text-white w-full md:w-64 flex-shrink-0 flex flex-col shadow-2xl z-20">
              <div className="p-8 border-b border-white/10 flex items-center gap-4 bg-black/10">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                  <ShieldCheck className="text-[#ffd700]" size={28} />
                </div>
                <div>
                  <p className="font-black text-xl leading-none tracking-tight text-white">GGS2</p>
                  <p className="text-[10px] text-[#ffd700] font-bold mt-1 uppercase tracking-[0.2em]">Region 8</p>
                </div>
              </div>
              
              <div className="flex-grow p-4 mt-4 space-y-1 overflow-y-auto">
                <NavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                <NavLink href="/duty-roster" icon={<ClipboardList size={20} />} label="ตารางเวร" />
                <NavLink href="/tasks" icon={<ShieldCheck size={20} />} label="รายการงาน" />
                <NavLink href="/officers" icon={<Users size={20} />} label="ข้อมูลกำลังพล" />
                <NavLink href="/line-setup" icon={<MessageSquare size={20} />} label="LINE Bot" />

                <NavLink href="/strategic-map" icon={<Share2 size={20} />} label="Mission Map" />
                <NavLink href="/ranking" icon={<Trophy size={20} />} label="Unit Ranking" />
              </div>

              <div className="p-4 border-t border-white/10 space-y-2 bg-black/10">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/5 hover:bg-red-500/20 text-red-200 transition-all group"
                >
                  <LogOut size={20} className="text-red-400 group-hover:text-red-200" />
                  <span className="font-black text-sm tracking-wide">ออกจากระบบ</span>
                </button>
                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed text-center">
                  Sub-Division 2<br/>Investigation Division
                </p>
              </div>
            </nav>

            <div className="flex-grow overflow-auto">
              {children}
            </div>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/10 transition-all group mx-2">
      <span className="text-white/40 group-hover:text-[#ffd700] transition-colors">{icon}</span>
      <span className="font-black text-sm tracking-wide text-white/80 group-hover:text-white transition-colors">{label}</span>
    </Link>
  );
}
