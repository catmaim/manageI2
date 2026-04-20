"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendLineMessage } from '@/lib/line';
import { 
  MessageSquare, Send, Save, CheckCircle2, AlertCircle, 
  Info, ShieldAlert, User, Wifi, MapPin, Search, Download, Filter, ChevronDown 
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
            officer_name: log.details?.officer_name || log.details?.line_name || 'บุคคลภายนอก / ยังไม่ยืนยัน',
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
    setMessage({ type: 'success', text: 'บันทึก ID ผู้รับเรียบร้อย' });
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
    link.href = URL.createObjectURL(blob);
    link.download = `GGS2_Audit_${user.officer_name}.csv`;
    document.body.appendChild(link);
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
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">LINE Control Center</h1>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">ระบบส่องพฤติกรรมและความมั่นคงดิจิทัล</p>
      </header>

      <main className="max-w-2xl mx-auto space-y-8 pb-20">
        <section className="bg-white rounded-[32px] shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
               <ShieldAlert size={18} className="text-[#800000]" /> การตั้งค่าระบบ
             </h2>
          </div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="LINE Target ID..."
              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold outline-none focus:border-[#800000]"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
            <button onClick={handleSave} className="px-8 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">Save</button>
          </div>
          {message.text && (
            <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={16} /> {message.text}
            </div>
          )}
        </section>

        <section className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-6 flex justify-between items-center">
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              รายการดักจับล่าสุด
            </h2>
            <button onClick={fetchLogs} className="text-[9px] text-[#ffd700] font-black uppercase tracking-widest">Refresh</button>
          </div>
          <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${log.log_type === 'SECURITY_TRACE' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{log.log_type}</span>
                    <p className="text-[#800000] font-mono text-[9px] font-bold break-all">T: {log.details.target || log.details.id}</p>
                    {log.details.sender && <p className="text-blue-500 font-mono text-[9px] font-bold break-all">S: {log.details.sender}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase ${log.details.officer_name ? 'text-green-600' : 'text-slate-400'}`}>
                      {log.details.officer_name ? `👮‍♂️ ${log.details.officer_name}:` : `👤 นิรนาม:`}
                    </span>
                    <p className="text-slate-800 text-[11px] font-black">{log.message}</p>
                  </div>
                  {log.details.isp && (
                    <div className="mt-1 flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase">
                      <Wifi size={10} /> {log.details.isp} | <MapPin size={10} /> {log.details.city}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => {setTargetId(log.details.target || log.details.id); window.scrollTo({top:0, behavior:'smooth'})}} className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase hover:bg-slate-800 hover:text-white transition-all">Target</button>
                  {log.details.sender && <button onClick={() => {setTargetId(log.details.sender); window.scrollTo({top:0, behavior:'smooth'})}} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Sender</button>}
                </div>
              </div>
            ))}
            <button onClick={() => setLogLimit(prev => prev + 10)} className="w-full py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">➕ โหลดประวัติเพิ่ม</button>
          </div>
        </section>
        <section className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 p-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h2 className="text-slate-800 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2"><User size={18} className="text-[#800000]" /> คลังประวัติกิจกรรม (ระบุห้วงเวลา)</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                 <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white text-slate-800 text-[10px] font-black uppercase px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <option value="ALL">ทุกประเภท</option>
                    <option value="LINE_MSG">ข้อความแชท</option>
                    <option value="SECURITY_TRACE">สัญญาณ ISP</option>
                 </select>
                 <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-[9px] font-black uppercase">จาก</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-slate-800 text-[10px] font-black uppercase outline-none" />
                 </div>
                 <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-400 text-[9px] font-black uppercase">ถึง</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-slate-800 text-[10px] font-black uppercase outline-none" />
                 </div>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="ค้นหาเจ้าหน้าที่หรือไอดี..." className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm font-bold outline-none focus:border-[#800000] shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredPersonnel.map((user: any) => (
              <div key={user.id} className="p-8 hover:bg-slate-50 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[22px] bg-[#800000] flex items-center justify-center text-[#ffd700] text-xl font-black shadow-lg">{user.officer_name ? user.officer_name[0] : '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-xl leading-none">{user.officer_name || 'ไม่ระบุชื่อ'}</p>
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="font-mono text-[9px] text-slate-400 uppercase tracking-tighter break-all">ID: {user.id}</p>
                        <p className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block w-fit ${user.last_isp !== 'N/A' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{user.last_isp !== 'N/A' ? `ISP: ${user.last_isp}` : 'NO TRACE'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => downloadCSV(user)} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all border border-slate-200 shadow-sm"><Download size={20} /></button>
                    <button onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#800000] transition-all shadow-md">{selectedUser === user.id ? 'ปิดประวัติ' : 'ดูย้อนหลัง'}</button>
                  </div>
                </div>
                {selectedUser === user.id && (
                  <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-100 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-4">
                      {user.history.filter((h: any) => { const logDate = h.time.split('T')[0]; return (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate) && (typeFilter === 'ALL' || h.type === typeFilter); }).map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-6 items-start pl-6 border-l-4 border-slate-100">
                          <div className="min-w-[80px] text-right pt-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(h.time).toLocaleDateString('th-TH', {day:'2-digit', month:'short'})}</p>
                            <p className="text-xs font-bold text-slate-900">{new Date(h.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div className="flex-1 bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm relative overflow-hidden">
                            {h.type === 'SECURITY_TRACE' && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>}
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${h.type === 'SECURITY_TRACE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{h.type}</span>
                            <p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">{h.msg}</p>
                            {h.details?.isp && <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-black text-blue-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50"><span className="flex items-center gap-1.5"><Wifi size={12} /> {h.details.isp}</span><span className="flex items-center gap-1.5"><MapPin size={12} /> {h.details.city}</span></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">GGS2 Intelligence Systems • Security Unit<br/>Investigation Division 2 • Region 8</p>
      </main>
      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #800000; }`}</style>
    </div>
  );
}
