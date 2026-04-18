"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendLineMessage } from '@/lib/line';
import { 
  MessageSquare, Send, Save, CheckCircle2, AlertCircle, 
  Info, ShieldAlert, User, Wifi, MapPin, Search, Download, Calendar as CalendarIcon, Filter, ChevronDown 
} from 'lucide-react';
import Link from 'next/link';

export default function LineSetupPage() {
  const [targetId, setTargetId] = useState('');
  const [testMsg, setTestMsg] = useState('GGS2 Assistant: ทดสอบการเชื่อมต่อระบบรักษาความปลอดภัย 🛡️');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [personnelLogs, setPersonnelLogs] = useState<Record<string, any>>({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Filtering & Pagination State
  const [logLimit, setLogLimit] = useState(10); 
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');     
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    const savedId = localStorage.getItem('line_target_id');
    if (savedId) setTargetId(savedId);
    fetchLogs();

    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [logLimit]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setLogs(data.slice(0, logLimit));

      const grouped: Record<string, any> = {};
      data.forEach(log => {
        const userId = log.details?.sender || log.details?.id;
        if (!userId) return;

        if (!grouped[userId]) {
          grouped[userId] = {
            id: userId,
            officer_name: log.details?.officer_name || 'บุคคลภายนอก / ยังไม่ยืนยัน',
            history: [],
            last_isp: 'N/A'
          };
        }

        grouped[userId].history.push({
          time: log.created_at,
          msg: log.message,
          type: log.log_type,
          details: log.details
        });

        if (log.log_type === 'SECURITY_TRACE' && log.details?.isp) {
          if (grouped[userId].last_isp === 'N/A') {
            grouped[userId].last_isp = log.details.isp;
          }
        }
      });
      setPersonnelLogs(grouped);
    }
  };

  const handleSave = () => {
    localStorage.setItem('line_target_id', targetId);
    setMessage({ type: 'success', text: 'Saved' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSendTest = async () => {
    if (!targetId) {
      setMessage({ type: 'error', text: 'กรุณาระบุ LINE Target ID ก่อน' });
      return;
    }
    setLoading(true);
    const res = await sendLineMessage(targetId, testMsg);
    if (res.success) {
      setMessage({ type: 'success', text: 'ส่งข้อความทดสอบสำเร็จ!' });
    } else {
      setMessage({ type: 'error', text: 'ส่งไม่สำเร็จ' });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const downloadCSV = (user: any) => {
    const headers = ['DateTime', 'LogType', 'Action', 'ISP', 'Location'];
    const filteredHistory = user.history.filter((h: any) => {
      const logDate = h.time.split('T')[0];
      const matchStart = !startDate || logDate >= startDate;
      const matchEnd = !endDate || logDate <= endDate;
      const matchType = typeFilter === 'ALL' || h.type === typeFilter;
      return matchStart && matchEnd && matchType;
    });

    const rows = filteredHistory.map((h: any) => [
      new Date(h.time).toLocaleString('th-TH'),
      h.type,
      h.msg.replace(/,/g, ' '),
      h.details?.isp || '-',
      h.details?.city || '-'
    ]);
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `GGS2_Audit_${user.officer_name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPersonnel = Object.values(personnelLogs).filter((user: any) => 
    user.officer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <div className="inline-flex p-4 bg-gradient-to-br from-[#800000] to-[#4a0000] rounded-[24px] shadow-2xl mb-6 border border-white/10">
          <MessageSquare className="text-[#ffd700]" size={40} />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">GGS2 Control Center</h1>
        <p className="text-sm text-[#ffd700] font-bold uppercase tracking-widest mt-2 opacity-60">ศูนย์ตรวจสอบพฤติกรรมและความมั่นคง</p>
      </header>

      <main className="max-w-2xl mx-auto space-y-8 pb-20">
        {/* Settings Box */}
        <section className="bg-slate-900/50 backdrop-blur-xl rounded-[32px] shadow-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Target Configuration</h2>
             <ShieldAlert size={16} className="text-[#800000]" />
          </div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="LINE Target ID..."
              className="flex-1 p-3 bg-black/20 border border-white/5 rounded-xl font-mono text-xs font-bold text-[#ffd700] outline-none focus:border-[#ffd700]/30 transition-all"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
            <button onClick={handleSave} className="px-6 bg-[#ffd700] text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 transition-all active:scale-95">Save</button>
          </div>
          {message.text && (
            <div className={`mt-4 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              <CheckCircle2 size={14} /> {message.text}
            </div>
          )}
        </section>
        {/* Webhook Logs */}
        <section className="bg-slate-900 rounded-[32px] shadow-2xl p-8 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#800000] opacity-5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              รายการดักจับล่าสุด (แสดง {logs.length} รายการ)
            </h2>
            <button onClick={fetchLogs} className="text-[9px] text-[#ffd700] font-black uppercase tracking-widest hover:opacity-100 opacity-60 transition-opacity">Refresh</button>
          </div>
          <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {logs.map((log) => (
              <div key={log.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                <div className="space-y-1">
                  <p className="text-[#ffd700] font-mono text-[10px] font-bold opacity-40">{log.details.id}</p>
                  <p className="text-white/90 text-[11px] font-bold leading-tight">{log.message}</p>
                </div>
                <button onClick={() => {setTargetId(log.details.id); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 bg-white/5 text-white rounded-lg hover:bg-[#ffd700] hover:text-black transition-all">
                  <Save size={14} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setLogLimit(prev => prev + 10)} className="w-full py-3 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:text-white border border-white/5 transition-all">
             โหลดประวัติย้อนหลังเพิ่ม (+10)
          </button>
        </section>

        {/* Personnel Audit with Time Range Filters */}
        <section className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/10 overflow-hidden">
          <div className="bg-slate-800/50 p-6 border-b border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <User size={16} className="text-[#ffd700]" />
                  คลังประวัติกิจกรรม (ระบุห้วงเวลา)
                </h2>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">Personnel Activity & Network Audit</p>
              </div>
              <div className="flex flex-wrap gap-2">
                 <select 
                   value={typeFilter} 
                   onChange={(e) => setTypeFilter(e.target.value)}
                   className="bg-black/40 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg outline-none border border-white/5"
                 >
                    <option value="ALL">ทุกประเภท</option>
                    <option value="LINE_MSG">ข้อความแชท</option>
                    <option value="SECURITY_TRACE">สัญญาณ ISP</option>
                 </select>
                 <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-white text-[8px] font-black uppercase opacity-30">จาก</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-white text-[9px] font-black uppercase outline-none" />
                 </div>
                 <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-white text-[8px] font-black uppercase opacity-30">ถึง</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-white text-[9px] font-black uppercase outline-none" />
                 </div>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="text"
                placeholder="ค้นหาเจ้าหน้าที่หรือไอดี..."
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white text-xs font-bold outline-none focus:border-[#ffd700]/30 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredPersonnel.map((user: any) => (
              <div key={user.id} className="p-6 hover:bg-white/5 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800000] to-[#4a0000] flex items-center justify-center text-[#ffd700] font-black shadow-lg">
                      {user.officer_name[0]}
                    </div>
                    <div>
                      <p className="font-black text-white leading-none">{user.officer_name}</p>
                      <p className={`text-[9px] font-bold mt-1.5 ${user.last_isp !== 'N/A' ? 'text-blue-400' : 'text-slate-600'}`}>
                        {user.last_isp !== 'N/A' ? `Last ISP: ${user.last_isp}` : 'No Trace Detected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => downloadCSV(user)} className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-green-600 hover:text-white transition-all border border-white/5">
                      <Download size={16} />
                    </button>
                    <button onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)} className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#800000] transition-all border border-white/10">
                      {selectedUser === user.id ? 'Hide' : 'Audit History'}
                    </button>
                  </div>
                </div>

                {selectedUser === user.id && (
                  <div className="mt-6 pt-6 border-t border-dashed border-white/10 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-4">
                      {user.history
                        .filter((h: any) => {
                          const logDate = h.time.split('T')[0];
                          const matchStart = !startDate || logDate >= startDate;
                          const matchEnd = !endDate || logDate <= endDate;
                          const matchType = typeFilter === 'ALL' || h.type === typeFilter;
                          return matchStart && matchEnd && matchType;
                        })
                        .map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-start pl-4 border-l-2 border-white/10">
                          <div className="min-w-[70px] text-right pt-1">
                            <p className="text-[8px] font-black text-slate-500 uppercase">{new Date(h.time).toLocaleDateString('th-TH', {day:'2-digit', month:'short'})}</p>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(h.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5 shadow-sm relative overflow-hidden">
                            {h.type === 'SECURITY_TRACE' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${h.type === 'SECURITY_TRACE' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}`}>{h.type}</span>
                            <p className="text-[12px] font-bold text-white/90 leading-tight mt-1">{h.msg}</p>
                            {h.details?.isp && (
                              <div className="mt-2 flex flex-wrap gap-2 text-[8px] font-black text-blue-400 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 uppercase tracking-tighter">
                                <Wifi size={10} /> {h.details.isp} | <MapPin size={10} /> {h.details.city}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {user.history.filter((h: any) => {
                        const logDate = h.time.split('T')[0];
                        return (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate) && (typeFilter === 'ALL' || h.type === typeFilter);
                      }).length === 0 && (
                        <p className="text-center text-[10px] text-slate-600 font-bold uppercase py-10 italic">
                          ไม่พบข้อมูลในช่วงเวลาที่คุณเลือก...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-[9px] text-white/20 font-black uppercase tracking-[0.2em] leading-relaxed">
          GGS2 Intelligence Systems • Security Unit<br/>
          Sub-Division 2 • Investigation Division
        </p>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ffd700; }
      `}</style>
    </div>
  );
}
