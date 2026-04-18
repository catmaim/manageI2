"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Star, Calendar, Filter, ArrowUp, Crown, ChevronLeft, ChevronRight } from 'lucide-react';

type TimeRange = 'today' | 'month' | 'year' | 'all';

export default function RankingPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  
  // Historical Selection State
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthsTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: officersData } = await supabase.from('officers').select('*');
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('status', 'Completed');
      
      if (officersData) setOfficers(officersData);
      if (tasksData) setTasks(tasksData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const calculateRanking = () => {
    const filteredTasks = tasks.filter(task => {
      if (!task.completed_at) return false;
      const compDate = new Date(task.completed_at);
      
      if (timeRange === 'today') {
        const targetDate = new Date(selectedDate);
        return compDate.toDateString() === targetDate.toDateString();
      }
      if (timeRange === 'month') {
        return compDate.getMonth() === selectedMonth && compDate.getFullYear() === selectedYear;
      }
      if (timeRange === 'year') {
        return compDate.getFullYear() === selectedYear;
      }
      return true; // all
    });

    return officers.map(officer => {
      const officerTasks = filteredTasks.filter(t => t.assigned_to === officer.id);
      const totalScore = officerTasks.reduce((sum, t) => sum + (t.difficulty_score || 1), 0);
      return {
        ...officer,
        score: totalScore,
        taskCount: officerTasks.length
      };
    }).sort((a, b) => b.score - a.score);
  };

  const rankedOfficers = calculateRanking();
  const top3 = rankedOfficers.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <header className="mb-12 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <Trophy className="text-[#800000]" size={28} />
              หน่วยจัดอันดับผลงาน (Unit Ranking)
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">วัดผลประสิทธิภาพรายบุคคล กก.สส.2</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 gap-1">
            {[
              { id: 'today', label: 'รายวัน' },
              { id: 'month', label: 'รายเดือน' },
              { id: 'year', label: 'รายปี' },
              { id: 'all', label: 'ทั้งหมด' }
            ].map((range) => (
              <button 
                key={range.id}
                onClick={() => setTimeRange(range.id as TimeRange)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === range.id 
                    ? 'bg-[#800000] text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-400 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Historical Pickers */}
        {timeRange !== 'all' && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm w-fit animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#800000]" />
              <span className="text-[10px] font-black text-slate-400 uppercase">
                {timeRange === 'today' ? 'ระบุวันที่:' : 'เลือกห้วงเวลา:'}
              </span>
            </div>
            
            {timeRange === 'today' && (
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-sm font-black text-[#800000] outline-none ring-1 ring-slate-200 focus:ring-[#800000]"
              />
            )}

            {timeRange === 'month' && (
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-sm font-black text-[#800000] outline-none ring-1 ring-slate-200 focus:ring-[#800000]"
              >
                {monthsTh.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}

            {(timeRange === 'month' || timeRange === 'year') && (
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-sm font-black text-[#800000] outline-none ring-1 ring-slate-200 focus:ring-[#800000]"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y + 543}</option>)}
              </select>
            )}
          </div>
        )}
      </header>

      {loading ? (
        <div className="text-center py-20 text-[#800000] font-black animate-pulse uppercase tracking-[0.2em]">กำลังคำนวณคะแนนเกียรติยศ...</div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Podium UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-10 px-4">
            {/* Rank 2 */}
            <div className="order-2 md:order-1 bg-white p-6 rounded-[32px] shadow-xl border-b-4 border-slate-200 text-center relative hover:scale-105 transition-transform">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg text-slate-400 font-black">2</div>
              <p className="mt-6 font-black text-slate-800">{top3[1]?.nick_name || '-'}</p>
              <div className="mt-2 text-2xl font-black text-[#800000]">{top3[1]?.score || 0}</div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Points earned</p>
            </div>

            {/* Rank 1 */}
            <div className="order-1 md:order-2 bg-[#800000] p-10 rounded-[48px] shadow-[0_20px_50px_rgba(128,0,0,0.3)] border-b-8 border-[#ffd700] text-center relative scale-110 z-10">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-[#ffd700] flex items-center justify-center border-4 border-white shadow-2xl animate-bounce">
                <Crown className="text-[#800000]" size={48} />
              </div>
              <p className="mt-8 font-black text-white text-2xl tracking-tight">{top3[0]?.nick_name || '-'}</p>
              <p className="text-[10px] text-[#ffd700] font-black uppercase tracking-[0.2em] mt-1">{top3[0]?.specialty || 'The Master'}</p>
              <div className="mt-6 text-5xl font-black text-white">{top3[0]?.score || 0}</div>
              <p className="text-[10px] text-white/40 font-bold uppercase mt-2">
                {timeRange === 'today' ? `วันที่ ${new Date(selectedDate).toLocaleDateString('th-TH')}` : 
                 timeRange === 'month' ? `ประจำเดือน ${monthsTh[selectedMonth]}` : 
                 timeRange === 'year' ? `ประจำปี ${selectedYear + 543}` : 'ผลงานรวม'}
              </p>
            </div>

            {/* Rank 3 */}
            <div className="order-3 bg-white p-6 rounded-[32px] shadow-xl border-b-4 border-orange-100 text-center relative hover:scale-105 transition-transform">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center border-4 border-white shadow-lg text-orange-400 font-black">3</div>
              <p className="mt-6 font-black text-slate-800">{top3[2]?.nick_name || '-'}</p>
              <div className="mt-2 text-2xl font-black text-[#800000]">{top3[2]?.score || 0}</div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Points earned</p>
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                อันดับ {timeRange === 'today' ? `วันที่ ${new Date(selectedDate).toLocaleDateString('th-TH')}` : 
                       timeRange === 'month' ? `${monthsTh[selectedMonth]} ${selectedYear + 543}` : 
                       timeRange === 'year' ? `พ.ศ. ${selectedYear + 543}` : 'ตลอดกาล'}
              </h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ffd700]"></div>
                <div className="w-2 h-2 rounded-full bg-[#800000]"></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-6">#</th>
                    <th className="px-4 py-6">รายนาม</th>
                    <th className="px-4 py-6 text-center">ความสำเร็จ</th>
                    <th className="px-10 py-6 text-right">คะแนนรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rankedOfficers.map((officer, index) => (
                    <tr key={officer.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-10 py-6">
                        <span className={`font-black text-lg ${index < 3 ? 'text-[#800000]' : 'text-slate-300'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <div>
                          <p className="font-black text-slate-800 group-hover:text-[#800000] transition-colors">{officer.nick_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{officer.specialty}</p>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">
                          <Star size={10} className="text-[#ffd700] fill-[#ffd700]" />
                          {officer.taskCount} งาน
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className="font-black text-2xl text-slate-800 group-hover:scale-110 inline-block transition-transform">{officer.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
