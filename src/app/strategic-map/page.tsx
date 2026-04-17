"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Network, Users, ShieldAlert, Target, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function StrategicMap() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: o } = await supabase.from('officers').select('*');
      const { data: t } = await supabase.from('tasks').select('*');
      if (o) setOfficers(o);
      if (t) setTasks(t);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-[#800000] font-black animate-pulse uppercase tracking-widest">Initialising Strategic View...</div>
    </div>
  );

  const categories = Array.from(new Set(tasks.map(t => t.crime_category || 'Other')));

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#800000]/10 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Activity className="text-[#800000]" size={20} />
               <span className="text-[10px] font-black text-[#800000] uppercase tracking-[0.3em]">Operational Network</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Strategic Mission Map</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">แผนผังปฏิบัติการ กก.สส.2 บก.สส.ภ.8</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="flex -space-x-2">
                {officers.slice(0, 5).map(o => (
                  <div key={o.id} className="w-6 h-6 rounded-full bg-[#800000] border-2 border-white flex items-center justify-center text-[8px] font-black text-white uppercase">{o.nick_name[0]}</div>
                ))}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase leading-none">กำลังพลปฏิบัติการ: {officers.length} นาย</p>
          </div>
        </header>

        <div className="relative">
          {/* Central Command Node */}
          <div className="flex justify-center mb-16">
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-[#800000] to-yellow-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
               <div className="relative bg-white border-2 border-[#800000] p-6 rounded-2xl shadow-xl flex flex-col items-center w-72">
                 <div className="bg-[#800000] p-3 rounded-full mb-3 shadow-lg shadow-[#800000]/20">
                    <ShieldAlert size={32} className="text-white" />
                 </div>
                 <p className="text-[10px] font-black uppercase text-[#800000]/70 tracking-[0.2em] mb-1 text-center">Commander in Charge</p>
                 <h2 className="text-xl font-black text-slate-800">พ.ต.ท.กฤษกร</h2>
                 <div className="mt-4 flex gap-2">
                    <span className="bg-green-100 text-green-700 text-[8px] font-black px-2 py-1 rounded-full uppercase">Online</span>
                    <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-2 py-1 rounded-full uppercase">HQ: นครศรีธรรมราช</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Tactical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {categories.map((cat, idx) => {
               const categoryTasks = tasks.filter(t => (t.crime_category || 'Other') === cat);
               return (
                 <div key={cat} className="space-y-6">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                      <div className={`w-2 h-8 rounded-full ${idx % 2 === 0 ? 'bg-[#800000]' : 'bg-yellow-500'}`}></div>
                      <div>
                        <h3 className="font-black uppercase tracking-wider text-sm text-slate-800">{cat}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">ภารกิจในความรับผิดชอบ: {categoryTasks.length}</p>
                      </div>
                    </div>

                    {/* Task Connection Nodes */}
                    <div className="space-y-4 pl-4 border-l-2 border-slate-200 ml-4">
                      {categoryTasks.map(task => {
                        const assigned = officers.find(o => o.id === task.assigned_to);
                        return (
                          <div key={task.id} className="relative group">
                            <div className="absolute -left-[26px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-200 group-hover:bg-[#800000] transition-colors"></div>
                            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-[#800000]/30 transition-all hover:-translate-y-1 cursor-default">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Mission ID: {task.id.split('-')[0]}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {task.status}
                                  </span>
                               </div>
                               <h4 className="font-black text-slate-800 text-xs mb-3 group-hover:text-[#800000] transition-colors">{task.title}</h4>
                               
                               <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                  <Link href={`/officers/${assigned?.id}`} className="flex items-center gap-2 group/link">
                                     <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-[#800000] border border-[#800000]/10 uppercase group-hover/link:bg-[#800000] group-hover/link:text-white transition-colors">
                                       {assigned?.nick_name?.[0] || 'N'}
                                     </div>
                                     <span className="text-[10px] font-bold text-slate-500 group-hover/link:text-[#800000]">{assigned?.nick_name || 'N/A'}</span>
                                  </Link>
                                  <div className="flex gap-0.5">
                                     {[...Array(3)].map((_, i) => (
                                       <div key={i} className={`w-1 h-1 rounded-full ${i < (task.difficulty_score || 1) ? 'bg-[#800000]' : 'bg-slate-200'}`}></div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                 </div>
               )
             })}
          </div>
        </div>

        <footer className="mt-20 text-center border-t border-slate-200 pt-8 pb-12">
           <Link href="/" className="text-slate-400 hover:text-[#800000] font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-2 transition-colors">
             <Activity size={14} /> Systems Synchronized with GGS2 Cloud
           </Link>
        </footer>
      </div>
    </div>
  );
}
