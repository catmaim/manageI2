"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, ClipboardList, AlertCircle, Phone, LogOut, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendLineMessage } from '@/lib/line';

export default function Dashboard() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  async function fetchDashboardData() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: officersData } = await supabase.from('officers').select('*');
    const { data: tasksData } = await supabase.from('tasks').select('*');
    const { data: rosterData } = await supabase.from('duty_roster').select('*').order('duty_date', { ascending: true });
    const { data: logsData } = await supabase.from('system_logs').select('details').eq('log_type', 'LINE_MSG');
    
    if (officersData) {
      setOfficers(officersData);
      // แยกรายชื่อที่รออนุมัติ
      setPendingApprovals(officersData.filter(o => o.line_status === 'pending'));
    }
    if (tasksData) setTasks(tasksData);
    if (rosterData) setRoster(rosterData);

    if (logsData) {
      const stats: Record<string, number> = {};
      logsData.forEach(log => {
        const name = log.details?.officer_name || 'ไม่ระบุชื่อ';
        stats[name] = (stats[name] || 0) + 1;
      });
      const sorted = Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setActivityStats(sorted);
    }
    setLoading(false);
  }

  const handleApprove = async (officerId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('officers')
      .update({ 
        line_status: status,
        // ถ้าปฏิเสธ ให้ล้าง Line User ID ทิ้งด้วย
        line_user_id: status === 'rejected' ? null : undefined 
      })
      .eq('id', officerId);

    if (!error) {
      alert(status === 'approved' ? 'อนุมัติการใช้งานเรียบร้อย!' : 'ปฏิเสธคำขอเรียบร้อย');
      fetchDashboardData(); // โหลดข้อมูลใหม่
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNotifyLine = async (duty: any) => {
    setNotifying(true);
    try {
      // ดึง ID ที่บันทึกไว้ในหน้า Line Setup (localStorage)
      const targetId = localStorage.getItem('line_target_id');
      
      if (!targetId) {
        alert('กรุณาไปตั้งค่า LINE Target ID ในหน้า Line Setup ก่อนครับ');
        router.push('/line-setup');
        return;
      }

      const message = `📢 แจ้งเวรปฏิบัติการวันนี้\n🗓️ วันที่: ${new Date(duty.duty_date).toLocaleDateString('th-TH')}\n👮 ชื่อ: ${duty.officer_name}\n📞 เบอร์ติดต่อ: ${duty.phone}\n#GGS2 #ManagementPortal`;
      
      const res = await sendLineMessage(targetId, message); 
      
      if (res.success) {
        alert('ส่งการแจ้งเตือนสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาด: ' + (res.error?.message || 'ไม่สามารถส่งข้อความได้'));
      }
    } catch (error) {
      console.error(error);
      alert('ระบบขัดข้อง');
    } finally {
      setNotifying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-[#800000] font-black animate-pulse uppercase tracking-widest text-sm">กำลังเชื่อมต่อ GGS2 Secure Cloud...</div>
    </div>
  );

  // Find today's duty officer
  const today = new Date().toISOString().split('T')[0];
  const todayDuty = roster.find(r => r.duty_date === today) || (roster.length > 0 ? roster[0] : null);

  const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalOfficers = officers.length;
  const highRiskTasks = tasks.filter(t => t.difficulty_score >= 4).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#800000] text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-inner">
            <LayoutDashboard className="text-[#800000]" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">GGS2 Management Portal</h1>
            <p className="text-[10px] text-[#ffd700] font-bold uppercase tracking-widest">Live Cloud Data Mode</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Dashboard</Link>
          <Link href="/duty-roster" className="text-[10px] font-black uppercase tracking-widest px-3 py-2 text-[#ffd700] border border-[#ffd700]/30 rounded-lg hover:bg-[#ffd700]/10 transition-colors flex items-center gap-2">
            <ClipboardList size={14} />
            ตารางเวร
          </Link>
        </nav>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Pending Registration Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="mb-8 bg-orange-50 border-2 border-orange-200 rounded-[32px] p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg text-white">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-black text-orange-800 uppercase tracking-tight">คำขอลงทะเบียนใหม่ ({pendingApprovals.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingApprovals.map(officer => (
                <div key={officer.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex justify-between items-center group hover:border-orange-300 transition-all">
                  <div>
                    <p className="font-black text-slate-800">{officer.rank}{officer.name}</p>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">ชื่อเล่น: {officer.nick_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(officer.id, 'rejected')}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      ปฏิเสธ
                    </button>
                    <button 
                      onClick={() => handleApprove(officer.id, 'approved')}
                      className="px-4 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-md active:scale-95 transition-all"
                    >
                      อนุมัติ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Duty Highlight */}
        {todayDuty && (
          <div className="mb-8 bg-white rounded-3xl p-1 shadow-xl border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="bg-[#800000] rounded-[22px] p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700] opacity-5 -mr-20 -mt-20 rounded-full"></div>
              <div className="flex items-center gap-6 z-10">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-white/20 shadow-lg">
                  <span className="text-[10px] font-black text-[#ffd700] uppercase tracking-widest">APR</span>
                  <span className="text-3xl font-black text-white leading-none">{new Date(todayDuty.duty_date).getDate()}</span>
                </div>
                <div>
                  <h2 className="text-[#ffd700] text-[10px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-pulse"></div>
                    เจ้าหน้าที่เวรปฏิบัติการวันนี้
                  </h2>
                  <p className="text-2xl font-black text-white leading-tight">{todayDuty.officer_name}</p>
                  <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-wider">{todayDuty.position}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-end gap-3 z-10 w-full md:w-auto">
                <button 
                  onClick={() => handleNotifyLine(todayDuty)}
                  disabled={notifying}
                  className="w-full md:w-auto px-6 py-3 bg-white text-[#800000] rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:bg-[#ffd700] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Send size={18} />
                  {notifying ? 'กำลังส่ง...' : 'แจ้งเวรเข้า LINE'}
                </button>
                <a href={`tel:${todayDuty.phone}`} className="w-full md:w-auto px-6 py-3 bg-[#ffd700] text-[#800000] rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:bg-white transition-all shadow-lg active:scale-95">
                  <Phone size={18} />
                  {todayDuty.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="งานที่กำลังดำเนินการ" value={activeTasks} icon={<ClipboardList size={20} />} color="border-l-4 border-blue-500" />
          <StatCard title="งานที่สำเร็จแล้ว" value={completedTasks} icon={<ClipboardList size={20} />} color="border-l-4 border-green-500" />
          <StatCard title="กำลังพลในระบบ" value={totalOfficers} icon={<Users size={20} />} color="border-l-4 border-[#800000]" />
          <StatCard title="งานด่วน (ระดับ 4+)" value={highRiskTasks} icon={<AlertCircle size={20} />} color="border-l-4 border-orange-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800">
              <Users size={20} className="text-[#800000]" />
              สถานะภาระงาน (Workload Indicator)
            </h2>
            <div className="space-y-4">
              {officers.map(officer => {
                const officerTasks = tasks.filter(t => t.assigned_to === officer.id && t.status !== 'Completed');
                const totalScore = officerTasks.reduce((sum, t) => sum + (t.difficulty_score || 1), 0);
                const statusColor = totalScore >= 5 ? 'bg-red-500' : totalScore >= 3 ? 'bg-yellow-500' : 'bg-green-500';
                
                return (
                  <Link key={officer.id} href={`/officers/${officer.id}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group border border-transparent hover:border-[#800000]/20">
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-[#800000]">{officer.nick_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{officer.specialty}</p>
                    </div>
                    <div className="text-right">
                      <div className={`h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden shadow-inner`}>
                        <div className={`h-full ${statusColor}`} style={{ width: `${Math.min(totalScore * 20, 100)}%` }}></div>
                      </div>
                      <p className="text-[10px] mt-1 font-black text-slate-500">LOAD: {totalScore}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800">
              <AlertCircle size={20} className="text-[#800000]" />
              งานวิกฤตที่ต้องเร่ง (High Priority)
            </h2>
            <div className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-400 uppercase font-black border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">ภารกิจ</th>
                    <th className="px-4 py-3 text-center">ระดับ</th>
                    <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {tasks.filter(t => t.status !== 'Completed').sort((a, b) => (b.difficulty_score || 0) - (a.difficulty_score || 0)).slice(0, 5).map(task => {
                    const assigned = officers.find(o => o.id === task.assigned_to);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-slate-800 font-bold">{task.title}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${task.difficulty_score >= 4 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                            {task.difficulty_score}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/officers/${assigned?.id}`} className="hover:text-[#800000] font-black transition-colors text-slate-600">
                            {assigned?.nick_name || 'N/A'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Activity Leaderboard Section */}
        <div className="mt-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700] opacity-5 -mr-20 -mt-20 rounded-full"></div>
          <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-[#800000] rounded-xl shadow-lg">
              <Users size={20} className="text-[#ffd700]" />
            </div>
            ทำเนียบการใช้งาน (Activity Leaderboard)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {activityStats.length > 0 ? activityStats.map((stat, index) => (
              <div key={stat.name} className="relative group p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:border-[#800000]/20 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-4 right-4 text-4xl font-black text-slate-200 group-hover:text-[#ffd700]/30 transition-colors leading-none">
                  #{index + 1}
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">เจ้าหน้าที่</p>
                  <p className="text-xl font-black text-[#800000] truncate">{stat.name}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Activity</p>
                      <p className="text-2xl font-black text-slate-800">{stat.count}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center border border-slate-100">
                      <Send size={20} className="text-[#ffd700]" />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[#800000] to-red-500 rounded-full shadow-lg transition-all duration-1000" 
                      style={{ width: `${Math.min((stat.count / (activityStats[0]?.count || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-5 py-12 text-center">
                <p className="text-slate-300 font-black uppercase tracking-widest text-sm animate-pulse">กำลังรวบรวมสถิติจาก GGS2 Cloud...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm ${color} transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
        <div className="text-slate-300">{icon}</div>
      </div>
      <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  );
}
