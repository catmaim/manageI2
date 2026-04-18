"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Phone, User, ArrowLeft, Plus, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import Link from 'next/link';

export default function DutyRosterPage() {
  const [rosterGroups, setRosterGroups] = useState<any>({});
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoster() {
      const { data } = await supabase
        .from('duty_roster')
        .select('*')
        .order('duty_date', { ascending: true });
      
      if (data) {
        const groups = data.reduce((acc: any, item: any) => {
          const date = new Date(item.duty_date);
          const monthYear = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = [];
          acc[monthYear].push(item);
          return acc;
        }, {});
        setRosterGroups(groups);

        // Auto-expand current month
        const currentMonth = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
        if (groups[currentMonth]) {
          setExpandedMonths([currentMonth]);
        } else if (Object.keys(groups).length > 0) {
          setExpandedMonths([Object.keys(groups)[0]]);
        }
      }
      setLoading(false);
    }
    fetchRoster();
  }, []);

  const toggleMonth = (monthYear: string) => {
    setExpandedMonths(prev => 
      prev.includes(monthYear) 
        ? prev.filter(m => m !== monthYear) 
        : [...prev, monthYear]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#800000] text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-white p-2 rounded-full shadow-inner hover:scale-110 transition-transform">
            <ArrowLeft className="text-[#800000]" size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">ตารางเวรปฏิบัติการ</h1>
            <p className="text-[10px] text-[#ffd700] font-bold uppercase tracking-widest">หน่วยเฉพาะกิจ GGS2</p>
          </div>
        </div>
        <Link href="/duty-roster/manage" className="px-4 py-2 bg-[#ffd700] text-[#800000] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2">
          <Plus size={14} />
          จัดการเวร
        </Link>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-[#800000] font-black animate-pulse">กำลังจัดระเบียบตารางเวร...</div>
          </div>
        ) : (
          Object.keys(rosterGroups).map((monthYear) => {
            const isExpanded = expandedMonths.includes(monthYear);
            return (
              <section key={monthYear} className="space-y-2">
                {/* Month Toggle Header */}
                <button 
                  onClick={() => toggleMonth(monthYear)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    isExpanded 
                      ? 'bg-[#800000] border-[#800000] text-white shadow-xl translate-y-[-2px]' 
                      : 'bg-white border-slate-200 text-slate-800 hover:border-[#800000]/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${isExpanded ? 'bg-white/10' : 'bg-slate-100'}`}>
                      <Calendar size={20} className={isExpanded ? 'text-[#ffd700]' : 'text-[#800000]'} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-black uppercase tracking-tight">{monthYear}</h2>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isExpanded ? 'text-white/60' : 'text-slate-400'}`}>
                        รวม {rosterGroups[monthYear].length} รายการปฏิบัติหน้าที่
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={24} className="text-[#ffd700]" /> : <ChevronRight size={24} className="text-slate-300" />}
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">รายนามผู้เข้าเวร</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">การติดต่อ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rosterGroups[monthYear].map((item: any) => {
                            const date = new Date(item.duty_date);
                            const day = date.getDate();
                            const weekday = date.toLocaleDateString('th-TH', { weekday: 'short' });
                            
                            return (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center group-hover:bg-[#800000] group-hover:border-[#800000] group-hover:text-white transition-all shadow-sm">
                                    <span className="text-xs font-black">{day}</span>
                                    <span className="text-[8px] font-bold uppercase opacity-60">{weekday}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-black text-slate-800 group-hover:text-[#800000] transition-colors">{item.officer_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.position}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <a href={`tel:${item.phone}`} className="inline-flex items-center gap-2 text-[#800000] font-black text-xs hover:bg-[#800000] hover:text-white px-4 py-2 rounded-xl transition-all border border-[#800000]/10 hover:shadow-md">
                                    <Phone size={12} />
                                    {item.phone}
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
