"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendLineMessage } from '@/lib/line';
import { MessageSquare, Send, Save, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LineSetupPage() {
  const [targetId, setTargetId] = useState('');
  const [testMsg, setTestMsg] = useState('GGS2 Assistant: ทดสอบการเชื่อมต่อระบบรักษาความปลอดภัย 🛡️');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const savedId = localStorage.getItem('line_target_id');
    if (savedId) setTargetId(savedId);
    fetchLogs();

    // Refresh logs every 10 seconds to catch new messages
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setLogs(data);
  };

  const handleSave = () => {
    localStorage.setItem('line_target_id', targetId);
    setMessage({ type: 'success', text: 'บันทึก ID ผู้รับเรียบร้อยแล้ว (เฉพาะเครื่องนี้)' });
  };

  const handleSendTest = async () => {
    if (!targetId) {
      setMessage({ type: 'error', text: 'กรุณาระบุ LINE Target ID ก่อน' });
      return;
    }
    setLoading(true);
    const res = await sendLineMessage(targetId, testMsg);
    if (res.success) {
      setMessage({ type: 'success', text: 'ส่งข้อความทดสอบสำเร็จ! โปรดเช็คใน LINE' });
    } else {
      setMessage({ type: 'error', text: 'ส่งไม่สำเร็จ: ' + (res.error?.message || res.message) });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <div className="inline-flex p-4 bg-[#800000] rounded-[24px] shadow-xl mb-6">
          <MessageSquare className="text-[#ffd700]" size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">LINE Bot Controller</h1>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">ตั้งค่าระบบแจ้งเตือนอัตโนมัติ กก.สส.2</p>
      </header>

      <main className="max-w-xl mx-auto space-y-8">
        {/* Connection Setup */}
        <section className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#800000] p-4 border-b border-[#800000]">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#ffd700]" />
              การเชื่อมต่อสัญญาณ
            </h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                LINE Target ID (User/Group ID)
                <Info size={12} />
              </label>
              <input 
                type="text" 
                placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold outline-none focus:border-[#800000] focus:ring-4 focus:ring-[#800000]/5 transition-all"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <Save size={18} /> บันทึกการตั้งค่า
            </button>
          </div>
        </section>

        {/* Test Command */}
        <section className="bg-white rounded-[32px] shadow-xl border border-slate-200 p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 -mr-16 -mt-16 rounded-full"></div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Send size={18} className="text-green-500" />
            ทดสอบการยิงข้อความ (Direct Message)
          </h2>
          <textarea 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all min-h-[100px]"
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
          />
          <button 
            onClick={handleSendTest}
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
          >
            {loading ? 'กำลังส่ง...' : <><Send size={18} /> ส่งทันที</>}
          </button>

          {message.text && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}
        </section>

        {/* Detected IDs from Webhook */}
        <section className="bg-slate-900 rounded-[32px] shadow-2xl p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              รหัสที่ดักจับได้ล่าสุด (Webhook Logs)
            </h2>
            <button onClick={fetchLogs} className="text-[9px] text-[#ffd700] font-black uppercase tracking-widest hover:underline">Refresh</button>
          </div>
          
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-white/20 text-[10px] text-center py-4 italic font-bold">ยังไม่พบคอมเมนต์หรือคำสั่งจาก LINE... ลองชวนบอทเข้ากลุ่มแล้วพิมพ์ "เช็คไอดี"</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[#ffd700] font-mono text-[10px] font-bold tracking-wider">{log.details.id}</p>
                      {log.officer_name && (
                        <span className="bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                          KNOWN: {log.officer_name}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">
                      Type: {log.details.type} • {new Date(log.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setTargetId(log.details.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#ffd700] hover:text-[#800000] transition-all"
                  >
                    ใช้ ID นี้
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="text-[9px] text-white/30 text-center font-bold italic">
            * คลิก "ใช้ ID นี้" เพื่อก๊อปปี้ไปวางในช่องตั้งค่าด้านบน
          </p>
        </section>

        <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          GGS2 Intelligence Systems • Security Unit
        </p>
      </main>
    </div>
  );
}
