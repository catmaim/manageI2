"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Award, BarChart3, Calendar, Clock, TrendingUp, Filter, Target, Dices, Ghost, Shield } from 'lucide-react';
import Link from 'next/link';

type TimeRange = 'week' | 'month' | 'year' | 'all';

export default function RankingPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      <div className="text-[#800000] font-black animate-pulse uppercase tracking-[0.2em]">Filtering Strategic Intelligence...</div>
    </div>
  );

  // Filter Logic
  const filterTasks = () => {
    return tasks.filter(t => {
      // Time Filter
      let timeMatch = true;
      if (timeRange !== 'all') {
        const date = new Date(t.created_at);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (timeRange === 'week') timeMatch = diffDays <= 7;
        else if (timeRange === 'month') timeMatch = diffDays <= 30;
        else if (timeRange === 'year') timeMatch = diffDays <= 365;
      }

      // Category Filter
      const categoryMatch = selectedCategory === 'all' || (t.crime_category || 'Other') === selectedCategory;

      return timeMatch && categoryMatch;
    });
  };

  const filteredTasks = filterTasks();
  const categories = Array.from(new Set(tasks.map(t => t.crime_category || 'Other')));

  // Process Ranking Data
  const rankingData = officers.map(officer => {
    const officerTasks = filteredTasks.filter(t => t.assigned_to === officer.id);
    const completedTasks = officerTasks.filter(t => t.status === 'Completed');
    const totalPoints = completedTasks.reduce((sum, t) => sum + (t.difficulty_score || 0), 0);
    
    return {
      ...officer,
      totalTasks: officerTasks.length,
      completedCount: completedTasks.length,
      totalPoints: totalPoints,
      completionRate: officerTasks.length > 0 ? (completedTasks.length / officerTasks.length) * 100 : 0
    };
  });

  const sortedBySuccess = [...rankingData].sort((a, b) => b.completedCount - a.completedCount);
  const sortedByLoad = [...rankingData].sort((a, b) => b.totalTasks - a.totalTasks);

  const maxTasks = Math.max(...rankingData.map(d => d.totalTasks), 1);
  const maxSuccess = Math.max(...rankingData.map(d => d.completedCount), 1);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#800000]/10 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#800000]">
               <Trophy size={24} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Performance Analytics</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">Unit Ranking</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">วิเคราะห์ผลงาน กก.สส.2 บก.สส.ภ.8</p>
          </div>

          {/* New Tactical Filter Bar */}
          <div className="flex flex-wrap items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm gap-4">
             <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                <Calendar size={14} className="text-slate-400" />
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="bg-transparent text-[11px] font-black uppercase outline-none text-slate-700 cursor-pointer"
                >
                  <option value="all">ทุกช่วงเวลา</option>
                  <option value="week">สัปดาห์นี้</option>
                  <option value="month">เดือนนี้</option>
                  <option value="year">ปีนี้</option>
                </select>
             </div>
             
             <div className="flex items-center gap-2 px-3">
                <Target size={14} className="text-slate-400" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-[11px] font-black uppercase outline-none text-slate-700 cursor-pointer"
                >
                  <option value="all">ทุกประเภทคดี</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Mission Success Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Award size={120} /></div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="bg-green-100 p-2 rounded-xl text-green-600"><Award size={24} /></div>
                   <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mission Success</h2>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase">ปิดงานสำเร็จ</span>
             </div>
             <div className="space-y-6 relative z-10">
                {sortedBySuccess.map((data, idx) => (
                  <div key={data.id}>
                    <div className="flex justify-between items-end mb-2">
                       <Link href={`/officers/${data.id}`} className="font-bold text-slate-700 hover:text-[#800000] flex items-center gap-2">
                          <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span>
                          {data.nick_name}
                       </Link>
                       <span className="text-sm font-black text-slate-800">{data.completedCount}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" style={{ width: `${(data.completedCount / maxSuccess) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Workload Distribution Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5"><BarChart3 size={120} /></div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="bg-[#800000]/10 p-2 rounded-xl text-[#800000]"><BarChart3 size={24} /></div>
                   <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Workload Flow</h2>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase">งานที่มอบหมาย</span>
             </div>
             <div className="space-y-6 relative z-10">
                {sortedByLoad.map((data) => (
                  <div key={data.id}>
                    <div className="flex justify-between items-end mb-2">
                       <Link href={`/officers/${data.id}`} className="font-bold text-slate-700 hover:text-[#800000]">{data.nick_name}</Link>
                       <span className="text-sm font-black text-slate-800">{data.totalTasks}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <div className="h-full bg-gradient-to-r from-[#800000] to-red-500 transition-all duration-1000" style={{ width: `${(data.totalTasks / maxTasks) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Dynamic Insight Panels */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#020617] p-6 rounded-[2rem] text-white flex flex-col justify-center">
              <p className="text-[#ffd700] text-[10px] font-black uppercase tracking-widest mb-1">Most Valuable Player</p>
              <h3 className="text-2xl font-black uppercase">{sortedBySuccess[0]?.nick_name || 'N/A'}</h3>
              <p className="text-slate-500 text-[9px] font-bold mt-2 uppercase tracking-tighter">Based on Selected Filters</p>
           </div>
           
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1 text-emerald-600">
                 <TrendingUp size={16} />
                 <p className="text-[10px] font-black uppercase tracking-widest">Efficiency</p>
              </div>
              <h3 className="text-3xl font-black text-slate-800">
                {Math.round(rankingData.reduce((sum, d) => sum + d.completionRate, 0) / Math.max(rankingData.length, 1))}%
              </h3>
              <p className="text-slate-400 text-[9px] font-bold uppercase mt-1">Average Completion Rate</p>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1 text-blue-600">
                 <Shield size={16} />
                 <p className="text-[10px] font-black uppercase tracking-widest">Operation Scope</p>
              </div>
              <h3 className="text-3xl font-black text-slate-800">{filteredTasks.length}</h3>
              <p className="text-slate-400 text-[9px] font-bold uppercase mt-1">Missions in Current View</p>
           </div>
        </div>

      </div>
    </div>
  );
}
