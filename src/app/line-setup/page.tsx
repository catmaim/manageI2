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
    const link = document.body.appendChild(document.createElement("a"));
    link.href = URL.createObjectURL(blob);
    link.download = `GGS2_Audit_${user.officer_name}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const filteredPersonnel = Object.values(personnelLogs).filter((user: any) => 
    user.officer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <div className="inline-flex p-4 bg-[#800000] rounded-[24px] shadow-xl mb-6">
          <MessageSquare className="text-[#ffd700]" size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">GGS2 Control Center</h1>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">ศูนย์ตรวจสอบพฤติกรรมและความมั่นคง</p>
      </header>

      <main className="max-w-2xl mx-auto space-y-8 pb-20">
        {/* Settings & Test (Compact) */}
        <section className="bg-white rounded-[32px] shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Configuration</h2>
             <ShieldAlert size={16} className="text-[#800000]" />
          </div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="LINE Target ID..."
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold outline-none focus:border-[#800000]"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
            <button onClick={() => {localStorage.setItem('line_target_id', targetId); setMessage({type:'success', text:'Saved'})}} className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Save</button>
          </div>
        </section>

        {/* Webhook Logs - Paginated to 10 Items */}
        <section className="bg-slate-900 rounded-[32px] shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              รายการดักจับล่าสุด (แสดง {logs.length} รายการ)
            </h2>
            <button onClick={fetchLogs} className="text-[9px] text-[#ffd700] font-black uppercase tracking-widest">Refresh</button>
          </div>
          <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center group">
                <div className="space-y-1">
                  <p className="text-[#ffd700] font-mono text-[9px] font-bold opacity-60">{log.details.id}</p>
                  <p className="text-white/90 text-[11px] font-bold">{log.message}</p>
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

        {/* Advanced Personnel Audit with Range Filters */}
        <section className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 p-6 border-b border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <User size={16} className="text-[#ffd700]" />
                  คลังประวัติกิจกรรม (ระบุห้วงเวลา)
                </h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Personnel Activity & Network Audit</p>
              </div>
              <div className="flex flex-wrap gap-2">
                 <select 
                   value={typeFilter} 
                   onChange={(e) => setTypeFilter(e.target.value)}
                   className="bg-slate-700 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg outline-none border border-slate-600 cursor-pointer"
                 >
                    <option value="ALL">ทุกประเภท</option>
                    <option value="LINE_MSG">ข้อความแชท</option>
                    <option value="SECURITY_TRACE">สัญญาณ ISP</option>
                 </select>
                 <div className="flex items-center gap-1 bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600">
                    <span className="text-white text-[8px] font-black uppercase opacity-50">จาก</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-white text-[9px] font-black uppercase outline-none"
                    />
                 </div>
                 <div className="flex items-center gap-1 bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600">
                    <span className="text-white text-[8px] font-black uppercase opacity-50">ถึง</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-white text-[9px] font-black uppercase outline-none"
                    />
                 </div>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="ค้นหาเจ้าหน้าที่หรือไอดี..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none focus:border-[#ffd700] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredPersonnel.map((user: any) => (
              <div key={user.id} className="p-6 hover:bg-slate-50 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#800000] font-black">{user.officer_name[0]}</div>
                    <div>
                      <p className="font-black text-slate-800 leading-none">{user.officer_name}</p>
                      <p className={`text-[9px] font-bold mt-1 ${user.last_isp !== 'N/A' ? 'text-blue-500' : 'text-slate-300'}`}>
                        {user.last_isp !== 'N/A' ? `Last ISP: ${user.last_isp}` : 'No Trace Detected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => downloadCSV(user)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Download Report">
                      <Download size={16} />
                    </button>
                    <button onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#800000] transition-all">
                      {selectedUser === user.id ? 'Hide' : 'Audit History'}
                    </button>
                  </div>
                </div>

                {selectedUser === user.id && (
                  <div className="mt-6 pt-6 border-t border-dashed border-slate-200 animate-in slide-in-from-top-2 duration-300">
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
                        <div key={idx} className="flex gap-4 items-start pl-4 border-l-2 border-slate-100">
                          <div className="min-w-[70px] text-right pt-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">{new Date(h.time).toLocaleDateString('th-TH', {day:'2-digit', month:'short'})}</p>
                            <p className="text-[10px] font-bold text-slate-600">{new Date(h.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative">
                            {h.type === 'SECURITY_TRACE' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${h.type === 'SECURITY_TRACE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{h.type}</span>
                            <p className="text-[12px] font-bold text-slate-800 leading-tight mt-1">{h.msg}</p>
                            {h.details?.isp && (
                              <div className="mt-2 flex flex-wrap gap-2 text-[8px] font-black text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 uppercase tracking-tighter">
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
                        <p className="text-center text-[10px] text-slate-300 font-bold uppercase py-10 italic">
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

        <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          GGS2 Intelligence Systems • Security Unit
        </p>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
}
