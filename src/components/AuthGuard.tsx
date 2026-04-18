"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      const isLoginPage = pathname === '/login';

      if (!session && !isLoginPage) {
        router.push('/login');
      } else if (session && isLoginPage) {
        router.push('/');
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#800000] mb-4" size={40} />
        <p className="text-[#800000] font-black uppercase tracking-widest text-xs">GGS2 Security Checking...</p>
      </div>
    );
  }

  return <>{children}</>;
}
