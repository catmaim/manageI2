"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { User, ClipboardCheck, Clock, TrendingUp, ChevronLeft, Share2, List, Shield, Target } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Params = Promise<{ id: string }>;

export default function OfficerPortfolio({ params }: { params: Params }) {
  const { id } = use(params);
  const [officer, setOfficer] = useState<any>(null);
  const [officerTasks, setOfficerTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    async function fetchData() {
      const { data: officerData } = await supabase.from('officers').select('*').eq('id', id).single();
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('assigned_to', id).order('created_at', { ascending: false });
      if (officerData) setOfficer(officerData);
      if (tasksData) setOfficerTasks(tasksData);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-[#800000] font-black animate-pulse">กำลังประมวลผลโครงข่ายภารกิจ...</div>
    </div>
  );

  if (!officer) return notFound();

  const completed = officerTasks.filter(t => t.status === 'Completed');
  const ongoing = officerTasks.filter(t => t.status !== 'Completed');
  const totalPoints = completed.reduce((sum, t) => sum + (t.difficulty_score || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#800000] transition-colors text-sm font-bold bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <ChevronLeft size={16} /> กลับสู่หน้าหลัก
          </Link>
          
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-[#800000] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><List size={14} /> รายการ</button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-[#800000] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Share2 size={14} /> Mind Map</button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="relative">
             <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-[#800000]/10 shadow-inner flex items-center justify-center text-[#800000]">
                <User size={48} />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[#800000] p-1.5 rounded-full border-2 border-white shadow-sm">
                <Shield size={16} fill="currentColor" />
             </div>
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-1">{officer.nick_name}</h1>
            <p className="text-slate-500 font-medium mb-4 uppercase text-xs tracking-widest">{officer.specialty} | {officer.unit}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatItem label="Workload Score" value={totalPoints} color="text-[#800000]" />
              <StatItem label="Mission Done" value={completed.length} color="text-green-600" />
              <StatItem label="Active Tasks" value={ongoing.length} color="text-blue-600" />
              <StatItem label="Ranking" value="#1" color="text-yellow-600" />
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-[#800000]" />
                รายละเอียดงาน
              </h2>
              <div className="space-y-4">
                {officerTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
            <SkillMatrix />
          </div>
        ) : (
          <TacticalMindMap officer={officer} tasks={officerTasks} />
        )}
      </div>
    </div>
  );
}

function TacticalMindMap({ officer, tasks }: { officer: any, tasks: any[] }) {
  // Group tasks by category
  const categories = Array.from(new Set(tasks.map(t => t.crime_category || 'Other')));
  
  return (
    <div className="bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-800 h-[600px] relative overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Background Cyber Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffd700 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Center Command Node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="relative group">
           <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/40 transition-all duration-1000"></div>
           <div className="relative bg-[#800000] border-4 border-yellow-500/50 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(128,0,0,0.5)]">
              <Target size={24} className="text-yellow-500 mb-1" />
              <p className="text-[10px] font-black uppercase text-yellow-500">{officer.nick_name}</p>
           </div>
        </div>
      </div>

      {/* Connection Lines & Category Nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {categories.map((cat, catIdx) => {
           const catAngle = (catIdx / categories.length) * 2 * Math.PI;
           const catRadius = 160;
           const catX = 300 + Math.cos(catAngle) * catRadius;
           const catY = 300 + Math.sin(catAngle) * catRadius;
           
           return (
             <g key={`cat-line-${catIdx}`}>
                <line x1="300" y1="300" x2={catX} y2={catY} stroke="#ffd700" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
                
                {/* Secondary Lines to Tasks */}
                {tasks.filter(t => (t.crime_category || 'Other') === cat).map((task, taskIdx, filteredTasks) => {
                   const taskOffsetAngle = (taskIdx - (filteredTasks.length - 1) / 2) * (Math.PI / 8);
                   const taskAngle = catAngle + taskOffsetAngle;
                   const taskRadius = 120;
                   const taskX = catX + Math.cos(taskAngle) * taskRadius;
                   const taskY = catY + Math.sin(taskAngle) * taskRadius;
                   
                   return (
                     <path 
                       key={`task-line-${task.id}`}
                       d={`M ${catX} ${catY} Q ${(catX+taskX)/2} ${(catY+taskY)/2} ${taskX} ${taskY}`}
                       stroke={cat === 'Gambling' ? '#ef4444' : '#3b82f6'}
                       strokeWidth="1.5"
                       fill="none"
                       opacity="0.4"
                     />
                   )
                })}
             </g>
           )
        })}
      </svg>

      {/* Nodes Layer */}
      <div className="absolute inset-0 flex items-center justify-center">
         <div className="relative w-full h-full max-w-[600px] max-h-[600px]">
            {categories.map((cat, catIdx) => {
               const catAngle = (catIdx / categories.length) * 2 * Math.PI;
               const catRadius = 160;
               const catX = Math.cos(catAngle) * catRadius;
               const catY = Math.sin(catAngle) * catRadius;

               return (
                 <div key={`cat-node-${cat}`} className="absolute top-1/2 left-1/2" style={{ transform: `translate(calc(-50% + ${catX}px), calc(-50% + ${catY}px))` }}>
                    <div className="bg-slate-800 border border-yellow-500/30 px-3 py-1.5 rounded-full shadow-lg">
                       <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">{cat}</p>
                    </div>

                    {/* Task Nodes for this category */}
                    {tasks.filter(t => (t.crime_category || 'Other') === cat).map((task, taskIdx, filteredTasks) => {
                       const taskOffsetAngle = (taskIdx - (filteredTasks.length - 1) / 2) * (Math.PI / 8);
                       const taskAngle = catAngle + taskOffsetAngle;
                       const taskRadius = 120;
                       const taskX = Math.cos(taskAngle) * taskRadius;
                       const taskY = Math.sin(taskAngle) * taskRadius;

                       return (
                         <div key={`task-node-${task.id}`} className="absolute top-1/2 left-1/2" style={{ transform: `translate(calc(-50% + ${taskX}px), calc(-50% + ${taskY}px))` }}>
                            <div className="bg-slate-900 border-2 border-slate-700/50 p-3 rounded-xl shadow-xl w-36 hover:border-yellow-500/50 transition-all cursor-pointer group">
                               <h4 className="text-[10px] font-bold text-slate-200 leading-tight group-hover:text-yellow-500">{task.title}</h4>
                               <div className="mt-2 flex justify-between items-center">
                                  <span className={`text-[7px] font-black px-1 rounded ${task.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>{task.status}</span>
                                  <span className="text-[7px] font-bold text-slate-500 italic">Score: {task.difficulty_score}</span>
                               </div>
                            </div>
                         </div>
                       )
                    })}
                 </div>
               )
            })}
         </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-6 left-6 flex gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-700 backdrop-blur-sm">
         <div className="flex items-center gap-2 text-[9px] font-black text-slate-400">
            <div className="w-2 h-2 rounded-full bg-red-500"></div> Gambling
         </div>
         <div className="flex items-center gap-2 text-[9px] font-black text-slate-400">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Others
         </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-black">
      <p className="text-[9px] text-slate-400 uppercase mb-0.5 tracking-tighter">{label}</p>
      <p className={`text-lg ${color}`}>{value}</p>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-[#800000] transition-all group">
      <div className="flex justify-between items-start mb-3 text-[10px] font-black">
        <span className={`px-2 py-0.5 rounded uppercase ${getCategoryColor(task.crime_category)}`}>{task.crime_category || 'Other'}</span>
        <span className={task.status === 'Completed' ? 'text-green-500' : 'text-blue-500'}>{task.status}</span>
      </div>
      <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#800000]">{task.title}</h3>
      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{task.description}</p>
      {task.completed_at && (
        <p className="mt-3 text-[10px] font-bold text-green-600">✓ สำเร็จเมื่อ: {new Date(task.completed_at).toLocaleDateString('th-TH')}</p>
      )}
    </div>
  );
}

function SkillMatrix() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
      <h2 className="text-xl font-bold text-slate-800 mb-6 font-black uppercase">Skill Matrix</h2>
      <div className="space-y-5">
        <SkillBar label="Investigation" value={85} color="bg-[#800000]" />
        <SkillBar label="Technical" value={60} color="bg-blue-500" />
        <SkillBar label="Field Ops" value={45} color="bg-orange-500" />
        <SkillBar label="Admin" value={90} color="bg-green-500" />
      </div>
    </div>
  );
}

function SkillBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
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

    default: return 'bg-slate-100 text-slate-700';
  }
}
