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
  MessageSquare,
  Users 
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <html lang="th">
      <body className="bg-[#0f172a] text-slate-200">
        <AuthGuard>
          <div className="flex flex-col md:flex-row min-h-screen relative overflow-hidden">
            {/* 🌌 Atmospheric Background Decoration */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#800000] opacity-[0.03] blur-[120px] rounded-full"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ffd700] opacity-[0.02] blur-[100px] rounded-full"></div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="relative z-20 bg-[#800000] bg-gradient-to-b from-[#800000] to-[#4a0000] text-white w-full md:w-72 flex-shrink-0 flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.3)] border-r border-white/5">
              <div className="p-8 border-b border-white/10 flex items-center gap-4 bg-black/20">
                <div className="p-2.5 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl border border-white/20 shadow-inner">
                  <ShieldCheck className="text-[#ffd700]" size={32} />
                </div>
                <div>
                  <p className="font-black text-2xl leading-none tracking-tighter text-white">GGS2</p>
                  <p className="text-[9px] text-[#ffd700] font-black mt-1.5 uppercase tracking-[0.3em] opacity-80">Intelligence Unit</p>
                </div>
              </div>
              
              <div className="flex-grow p-5 mt-6 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4 mb-4">Operations</p>
                <NavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === '/'} />
                <NavLink href="/duty-roster" icon={<ClipboardList size={20} />} label="ตารางเวร" active={pathname.startsWith('/duty-roster')} />
                <NavLink href="/tasks" icon={<ShieldCheck size={20} />} label="รายการงาน" active={pathname.startsWith('/tasks')} />
                <NavLink href="/officers" icon={<Users size={20} />} label="ข้อมูลกำลังพล" active={pathname.startsWith('/officers')} />
                <NavLink href="/line-setup" icon={<MessageSquare size={20} />} label="LINE Bot Center" active={pathname === '/line-setup'} />

                <div className="pt-6">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4 mb-4">Tactical Tools</p>
                  <NavLink href="/strategic-map" icon={<Share2 size={20} />} label="Mission Map" active={pathname === '/strategic-map'} />
                  <NavLink href="/ranking" icon={<Trophy size={20} />} label="Unit Ranking" active={pathname === '/ranking'} />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 space-y-4 bg-black/20">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-red-500/20 text-red-200 border border-white/5 transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <LogOut size={18} className="text-red-400 group-hover:text-red-200 transition-colors" />
                    <span className="font-black text-xs uppercase tracking-widest">Sign Out</span>
                  </div>
                  <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="text-center">
                  <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] leading-relaxed">
                    Sub-Division 2 • Region 8<br/>Digital Warfare System
                  </p>
                </div>
              </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-grow overflow-auto relative z-10 bg-[#0f172a]/50 backdrop-blur-sm">
              <main className="min-h-screen page-fade-in">
                {children}
              </main>
            </div>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}

function ChevronRight({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

function NavLink({ href, icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-white/10' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`transition-all duration-300 ${active ? 'text-[#ffd700] scale-110' : 'text-white/30 group-hover:text-[#ffd700]'}`}>
        {icon}
      </span>
      <span className={`font-black text-[13px] tracking-wide transition-colors ${active ? 'text-white' : 'group-hover:text-white'}`}>
        {label}
      </span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-[0_0_10px_#ffd700]"></div>
      )}
    </Link>
  );
}
