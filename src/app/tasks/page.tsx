"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-[#800000]">กำลังเชื่อมต่อ GGS2 Cloud...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Investigative Task Board</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Live Data Management</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-96">
            <Search size={18} className="text-slate-400 ml-2" />
            <input type="text" placeholder="ค้นหาภารกิจ..." className="bg-transparent border-none focus:outline-none text-sm w-full font-bold" />
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <span>Total Missions: {tasks.length}</span>
             </div>
            <Link href="/tasks/new" className="bg-[#800000] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-800 transition-all shadow-md active:scale-95">
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
                  <th className="px-6 py-5 text-right">อัปเดตล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tasks.map(task => {
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
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-[10px] font-bold text-slate-400">
                           {task.completed_at ? `เสร็จเมื่อ: ${new Date(task.completed_at).toLocaleDateString('th-TH')}` : `Deadline: ${task.due_date ? new Date(task.due_date).toLocaleDateString('th-TH') : '-'}`}
                         </span>
                      </td>
                    </tr>
                  );
                })}
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
