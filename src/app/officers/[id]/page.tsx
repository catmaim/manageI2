"use client";

import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, ClipboardCheck, Clock, TrendingUp, ChevronLeft, Share2, List, Shield, Target, Dices, Ghost, FileText, Map, Settings, Zap, Plus, Minus, Maximize } from 'lucide-react';
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
      <div className="text-[#800000] font-black animate-pulse uppercase tracking-widest flex items-center gap-3">
        <Zap className="animate-bounce" /> Loading Tactical Network...
      </div>
    </div>
  );

  if (!officer) return notFound();

  const completed = officerTasks.filter(t => t.status === 'Completed');
  const ongoing = officerTasks.filter(t => t.status !== 'Completed');
  const totalPoints = completed.reduce((sum, t) => sum + (t.difficulty_score || 0), 0);

  return (
    <div className="min-h-[100vh] bg-slate-50 p-6 font-sans overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#800000] transition-colors text-sm font-bold bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <ChevronLeft size={16} /> กลับสู่หน้าหลัก
          </Link>
          
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'list' ? 'bg-[#800000] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><List size={14} /> รายการ</button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'map' ? 'bg-[#800000] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Share2 size={14} /> Tactical Mind Map</button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-6 items-center shrink-0">
          <div className="relative">
             <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-[#800000]/10 flex items-center justify-center text-[#800000]">
                <User size={32} />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[#800000] p-1 rounded-full border border-white shadow-sm">
                <Shield size={12} fill="currentColor" />
             </div>
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{officer.nick_name}</h1>
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-1">{officer.specialty} | {officer.unit}</p>
          </div>
          <div className="flex gap-4">
              <HeaderStat label="Missions" value={officerTasks.length} />
              <HeaderStat label="Score" value={totalPoints} />
          </div>
        </div>

        <div className="flex-grow relative min-h-0">
            {viewMode === 'list' ? (
              <div className="h-full overflow-auto pr-2 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                            <ClipboardCheck size={20} className="text-[#800000]" /> รายละเอียดภารกิจ
                        </h2>
                        {officerTasks.length > 0 ? officerTasks.map(task => <TaskCard key={task.id} task={task} />) : <NoTasks />}
                    </div>
                    <SkillMatrix />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 pb-6">
                <TacticalNetworkMap officer={officer} tasks={officerTasks} />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function TacticalNetworkMap({ officer, tasks }: { officer: any, tasks: any[] }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const categories = Array.from(new Set(tasks.map(t => t.crime_category || 'Other')));
  const centerX = 500;
  const centerY = 500;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="h-full w-full bg-[#020617] rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden group/canvas cursor-grab active:cursor-grabbing select-none"
    >
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      
      {/* Zoom Controls */}
      <div className="absolute top-6 right-6 z-[100] flex flex-col gap-1 bg-slate-900/90 p-2 rounded-2xl border border-slate-700 backdrop-blur-xl">
         <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2.5 hover:bg-slate-800 text-white rounded-xl transition-colors"><Plus size={18} /></button>
         <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2.5 hover:bg-slate-800 text-white rounded-xl transition-colors"><Minus size={18} /></button>
         <button onClick={() => {setZoom(1); setPan({x:0,y:0})}} className="p-2.5 hover:bg-slate-800 text-yellow-500 rounded-xl transition-colors border-t border-slate-800 mt-1"><Maximize size={18} /></button>
      </div>

      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <div className="relative w-[1000px] h-[1000px] shrink-0">
          
          {/* SVG Connections */}
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            {categories.map((cat, catIdx) => {
              const catAngle = (catIdx / categories.length) * 2 * Math.PI - (Math.PI / 2);
              const catRadius = 220;
              const catX = centerX + Math.cos(catAngle) * catRadius;
              const catY = centerY + Math.sin(catAngle) * catRadius;
              const catTasks = tasks.filter(t => (t.crime_category || 'Other') === cat);

              return (
                <g key={`network-${catIdx}`}>
                  {/* Primary Link (Curve) */}
                  <path 
                    d={`M ${centerX} ${centerY} Q ${centerX} ${catY}, ${catX} ${catY}`}
                    stroke="#800000" strokeWidth="4" fill="none" opacity="0.3"
                  />
                  <path 
                    d={`M ${centerX} ${centerY} Q ${centerX} ${catY}, ${catX} ${catY}`}
                    stroke="#ffd700" strokeWidth="1.5" fill="none" opacity="0.5"
                  />
                  
                  {/* Task Links */}
                  {catTasks.map((task, taskIdx) => {
                    const spread = Math.PI / 2.5;
                    const taskAngle = catAngle + (taskIdx - (catTasks.length - 1) / 2) * (spread / Math.max(catTasks.length, 1));
                    const taskRadius = 180;
                    const taskX = catX + Math.cos(taskAngle) * taskRadius;
                    const taskY = catY + Math.sin(taskAngle) * taskRadius;

                    return (
                      <line 
                        key={`t-l-${task.id}`}
                        x1={catX} y1={catY} x2={taskX} y2={taskY}
                        stroke={task.status === 'Completed' ? '#22c55e' : '#3b82f6'}
                        strokeWidth="1.5" strokeDasharray={task.status === 'Completed' ? 'none' : '4,4'}
                        opacity="0.4"
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>

          {/* Center: Officer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-auto">
            <div className="bg-[#800000] border-4 border-yellow-500 w-32 h-32 rounded-[2.5rem] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(128,0,0,0.6)]">
               <div className="bg-white/10 p-3 rounded-full mb-1"><Target size={32} className="text-yellow-400" /></div>
               <p className="text-xs font-black uppercase text-white tracking-widest">{officer.nick_name}</p>
            </div>
          </div>

          {/* Category Nodes */}
          {categories.map((cat, catIdx) => {
            const catAngle = (catIdx / categories.length) * 2 * Math.PI - (Math.PI / 2);
            const catRadius = 220;
            const catX = centerX + Math.cos(catAngle) * catRadius;
            const catY = centerY + Math.sin(catAngle) * catRadius;
            const CategoryIcon = getCategoryIcon(cat);
            const catTasks = tasks.filter(t => (t.crime_category || 'Other') === cat);

            return (
              <div key={`cat-${catIdx}`}>
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  style={{ left: `${catX}px`, top: `${catY}px` }}
                >
                  <div className="bg-slate-900 border-2 border-yellow-500/50 p-4 rounded-[1.5rem] shadow-2xl flex flex-col items-center justify-center w-24 h-24 hover:border-yellow-400 transition-colors">
                     <CategoryIcon size={24} className="text-yellow-500 mb-1" />
                     <p className="text-[10px] font-black text-slate-100 uppercase tracking-tighter text-center leading-none">{cat}</p>
                  </div>
                </div>

                {/* Task Nodes */}
                {catTasks.map((task, taskIdx) => {
                    const spread = Math.PI / 2.5;
                    const taskAngle = catAngle + (taskIdx - (catTasks.length - 1) / 2) * (spread / Math.max(catTasks.length, 1));
                    const taskRadius = 180;
                    const taskX = catX + Math.cos(taskAngle) * taskRadius;
                    const taskY = catY + Math.sin(taskAngle) * taskRadius;

                    return (
                      <div 
                        key={`task-${task.id}`}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
                        style={{ left: `${taskX}px`, top: `${taskY}px` }}
                      >
                        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-xl w-48 hover:border-[#ffd700] transition-all group">
                           <div className="flex justify-between items-start gap-2">
                              <h4 className="text-[10px] font-black text-slate-100 leading-tight group-hover:text-yellow-500 transition-colors uppercase line-clamp-2">{task.title}</h4>
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 border border-slate-800 ${task.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
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

      {/* Interface Panel */}
      <div className="absolute bottom-8 left-8 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl backdrop-blur-lg">
         <p className="text-[10px] font-black uppercase text-yellow-500 tracking-widest mb-1">Status Report</p>
         <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Finished</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Processing</span>
         </div>
      </div>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string, value: any }) {
    return (
        <div className="text-center px-4 border-r border-slate-100 last:border-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-black text-slate-800 leading-none">{value}</p>
        </div>
    )
}

function NoTasks() {
    return (
        <div className="p-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300">
            <Shield size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-widest text-xs">No Missions Found</p>
        </div>
    )
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-[#800000] transition-all group">
      <div className="flex justify-between items-start mb-3 text-[10px] font-black">
        <span className={`px-2 py-0.5 rounded border ${getCategoryColor(task.crime_category)}`}>{task.crime_category || 'Other'}</span>
        <span className={task.status === 'Completed' ? 'text-green-500' : 'text-blue-500'}>{task.status}</span>
      </div>
      <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#800000]">{task.title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
      {task.completed_at && (
        <p className="mt-4 text-[10px] font-black text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md tracking-tighter uppercase">✓ Completed: {new Date(task.completed_at).toLocaleDateString('th-TH')}</p>
      )}
    </div>
  );
}

function SkillMatrix() {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 h-fit">
      <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tighter border-l-4 border-[#800000] pl-3">Ability Profile</h2>
      <div className="space-y-6">
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
      <div className="flex justify-between text-[10px] font-black mb-2 uppercase text-slate-400 tracking-widest">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} shadow-lg`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'Gambling': return 'bg-red-50 text-red-700 border-red-100';
    case 'Scam': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Gun': return 'bg-slate-800 text-white border border-slate-800';
    case 'PPT': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'Field Ops': return 'bg-orange-50 text-orange-700 border border-orange-100';

    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'Gambling': return Dices;
    case 'Scam': return Ghost;
    case 'Gun': return Target;
    case 'Admin': return FileText;
    case 'Field Ops': return Map;
    default: return Settings;
  }
}
