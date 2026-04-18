"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('รหัสผ่านไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึงระบบ');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#800000]"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#800000]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#ffd700]/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-[#800000] p-8 text-center relative">
            <div className="inline-flex p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 mb-4 shadow-inner">
              <ShieldCheck className="text-[#ffd700]" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">GGS2 Secure Login</h1>
            <p className="text-[10px] text-[#ffd700] font-bold uppercase tracking-[0.2em] mt-1">ระบบบริหารจัดการกำลังพล กก.สส.2</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-[#800000] transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="admin@ggs2.police.go.th"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-[#800000] focus:ring-4 focus:ring-[#800000]/5 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-[#800000] transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-[#800000] focus:ring-4 focus:ring-[#800000]/5 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#800000] text-[#ffd700] rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#600000] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'ยืนยันตัวตนเข้าสู่ระบบ'
              )}
            </button>
          </form>

          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Authorized Personnel Only • Police Region 8
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
