"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, Edit3, Calendar, FileText, Download, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: o } = await supabase.from('officers').select('*');
    const { data: t } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (o) setOfficers(o);
    if (t) setTasks(t);
    setLoading(false);
  }

  const updateStatus = async (taskId: string, newStatus: string) => {
    let completedAt = null;
    if (newStatus === 'Completed') {
      completedAt = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: completedAt })
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, completed_at: completedAt } : t));
    }
  };

  // Filter Logic for Monthly Reporting
  const filteredTasks = tasks.filter(t => {
    const taskDate = new Date(t.created_at);
    return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear;
  });

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const handleNotifyOfficer = async (task: any, officer: any) => {
    if (!officer?.line_user_id) return alert('เจ้าหน้าที่คนนี้ยังไม่ได้ลงทะเบียน LINE ครับ');
    
    const confirmSend = confirm(`ยืนยันการส่งงานด่วนหาคุณ ${officer.nick_name} หรือไม่?`);
    if (!confirmSend) return;

    const message = `🚨 มีงานด่วนมอบหมายถึงคุณ!\n📌 ภารกิจ: ${task.title}\n📂 หมวดหมู่: ${task.crime_category}\n\n⚠️ โปรดกดรับทราบภารกิจที่นี่เพื่อรายงานตัวเข้าแผนงานครับ:`;
    
    // ลิงก์ดักจับสัญญาณ (Ghost Tracker)
    const trackingUrl = `https://manage-i2-snowy.vercel.app/verify?task=${task.id}`;

    const res = await fetch('/api/line-msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        to: officer.line_user_id, 
        message: message + "\n" + trackingUrl 
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert('ส่งงานและลิงก์รายงานตัวเรียบร้อยแล้ว!');
    } else {
      alert('เกิดข้อผิดพลาดในการส่ง');
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-[#800000]">กำลังเชื่อมต่อ GGS2 Cloud...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Investigative Task Board</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide">จัดการและติดตามสถานะงาน กก.สส.2</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {/* Month/Year Selection for Reporting */}
             <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm gap-3">
                <Calendar size={16} className="text-[#800000]" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold outline-none text-slate-700 cursor-pointer"
                >
                  {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold outline-none text-slate-700 cursor-pointer"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y + 543}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-64">
                <Search size={18} className="text-slate-400 ml-2" />
                <input type="text" placeholder="ค้นหาภารกิจ..." className="bg-transparent border-none focus:outline-none text-xs w-full font-bold" />
             </div>
          </div>
        </header>

        {/* Monthly Summary Insight */}
        <div className="bg-[#800000] text-white p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-[#800000]/20">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md"><FileText size={24} /></div>
              <div>
                 <h2 className="text-lg font-black uppercase tracking-tight">รายงานประจำเดือน{months[selectedMonth]} {selectedYear + 543}</h2>
                 <p className="text-xs text-red-100/70 font-bold uppercase tracking-widest">สรุปผลการปฏิบัติงานของหน่วย</p>
              </div>
           </div>
           <div className="flex gap-8">
              <div className="text-center">
                 <p className="text-[10px] font-black uppercase opacity-60">งานเข้าทั้งหมด</p>
                 <p className="text-2xl font-black">{filteredTasks.length}</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black uppercase opacity-60">ปิดงานสำเร็จ</p>
                 <p className="text-2xl font-black text-green-400">{filteredTasks.filter(t => t.status === 'Completed').length}</p>
              </div>
              <button className="bg-white text-[#800000] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-2">
                 <Download size={14} /> Export Report
              </button>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <span>Found: {filteredTasks.length} Missions</span>
             </div>
            <Link href="/tasks/new" className="bg-[#800000] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-800 transition-all shadow-md">
              + มอบหมายงานใหม่
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-tighter">
                <tr>
                  <th className="px-6 py-5">ภารกิจ</th>
                  <th className="px-6 py-5">ผู้รับผิดชอบ</th>
                  <th className="px-6 py-5">สถานะงาน</th>
                  <th className="px-6 py-5 text-right">วันบันทึก / วันสำเร็จ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTasks.length > 0 ? filteredTasks.map(task => {
                  const assigned = officers.find(o => o.id === task.assigned_to);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase mb-1 inline-block ${getCategoryColor(task.crime_category)}`}>
                          {task.crime_category || 'Other'}
                        </span>
                        <p className="font-black text-slate-800 leading-tight">{task.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/officers/${assigned?.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-[#800000]/10 flex items-center justify-center text-[10px] font-black text-[#800000] border border-[#800000]/20 uppercase">
                            {assigned?.nick_name?.[0] || 'N'}
                          </div>
                          <span className="text-slate-700 font-black">{assigned?.nick_name || 'N/A'}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="relative inline-block w-40">
                             <select 
                               value={task.status}
                               onChange={(e) => updateStatus(task.id, e.target.value)}
                               className={`appearance-none w-full pl-3 pr-8 py-2 rounded-lg border text-[11px] font-black uppercase tracking-tight outline-none cursor-pointer transition-all ${getStatusStyles(task.status)}`}
                             >
                               <option value="To Do">To Do</option>
                               <option value="In Progress">In Progress</option>
                               <option value="Review">Review</option>
                               <option value="Completed">Completed</option>
                             </select>
                             <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                           </div>
                           <Link href={`/tasks/${task.id}/edit`} className="p-2 text-slate-400 hover:text-[#800000] transition-colors bg-white border border-slate-200 rounded-lg shadow-sm">
                             <Edit3 size={14} />
                           </Link>
                           {assigned?.line_user_id && (
                             <button 
                               onClick={() => handleNotifyOfficer(task, assigned)}
                               className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 transition-all bg-white border border-blue-100 rounded-lg shadow-sm"
                               title="ส่งงานด่วนและลิงก์รายงานตัวเข้า LINE"
                             >
                               <MessageSquare size={14} />
                             </button>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400">เข้าเมื่อ: {new Date(task.created_at).toLocaleDateString('th-TH')}</span>
                            {task.completed_at && (
                                <span className="text-[10px] font-black text-green-600 uppercase mt-1">เสร็จเมื่อ: {new Date(task.completed_at).toLocaleDateString('th-TH')}</span>
                            )}
                         </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                       ไม่มีภารกิจถูกบันทึกในเดือนนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'Gambling': return 'bg-red-100 text-red-700 border border-red-200';
    case 'Scam': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'Porn': return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'Gun': return 'bg-slate-800 text-white border border-slate-900';
    case 'PPT': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'Field Ops': return 'bg-orange-100 text-orange-700 border border-orange-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'Completed': return 'bg-green-50 text-green-700 border-green-200 hover:border-green-400';
    case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400';
    case 'Review': return 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400';
    default: return 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400';
  }
}
