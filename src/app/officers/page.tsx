"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Trash2, Shield, User, Star, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function OfficersManagement() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newOfficer, setNewOfficer] = useState({
    rank: '',
    name: '',
    nick_name: '',
    specialty: '',
    unit: 'กก.สส.2'
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  async function fetchOfficers() {
    const { data } = await supabase.from('officers').select('*').order('rank', { ascending: true });
    if (data) setOfficers(data);
    setLoading(false);
  }

  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficer.name || !newOfficer.nick_name) return alert('กรุณากรอกชื่อและชื่อเล่นครับ');

    const { error } = await supabase.from('officers').insert([newOfficer]);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setNewOfficer({ rank: '', name: '', nick_name: '', specialty: '', unit: 'กก.สส.2' });
      setIsAdding(false);
      fetchOfficers();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`ยืนยันการลบข้อมูลของ ${name} หรือไม่?`)) {
      const { error } = await supabase.from('officers').delete().eq('id', id);
      if (!error) fetchOfficers();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#800000]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#800000] text-white p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black uppercase tracking-tight">จัดการกำลังพล (Officers)</h1>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#ffd700] text-[#800000] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          {isAdding ? 'ยกเลิก' : <><UserPlus size={16} /> เพิ่มคนใหม่</>}
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {/* Add Officer Form */}
        {isAdding && (
          <div className="mb-8 bg-white p-6 rounded-[32px] shadow-xl border-2 border-[#ffd700] animate-in zoom-in-95 duration-300">
            <h2 className="text-lg font-black mb-4 text-slate-800 flex items-center gap-2">
              <Shield className="text-[#800000]" size={20} />
              บันทึกข้อมูลเจ้าหน้าที่ใหม่
            </h2>
            <form onSubmit={handleAddOfficer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ยศ (Rank)</label>
                <input 
                  placeholder="เช่น พ.ต.ท., ส.ต.อ."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#800000] outline-none transition-all font-bold"
                  value={newOfficer.rank}
                  onChange={e => setNewOfficer({...newOfficer, rank: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ชื่อ-นามสกุล (Full Name)</label>
                <input 
                  placeholder="ชื่อ นามสกุล"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#800000] outline-none transition-all font-bold"
                  value={newOfficer.name}
                  onChange={e => setNewOfficer({...newOfficer, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ชื่อเล่น (Nickname) *ใช้ลงทะเบียน LINE</label>
                <input 
                  placeholder="เช่น กอล์ฟ, บิว"
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#800000] outline-none transition-all font-black text-[#800000]"
                  value={newOfficer.nick_name}
                  onChange={e => setNewOfficer({...newOfficer, nick_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ความเชี่ยวชาญ (Specialty)</label>
                <input 
                  placeholder="เช่น สืบสวนเทคโนโลยี, วิเคราะห์ข้อมูล"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#800000] outline-none transition-all font-bold"
                  value={newOfficer.specialty}
                  onChange={e => setNewOfficer({...newOfficer, specialty: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="w-full py-4 bg-[#800000] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]">
                  บันทึกเข้าสู่ระบบ GGS2
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Officers List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">รายชื่อกำลังพลทั้งหมด</h2>
            <span className="bg-slate-200 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">{officers.length} PERSONS</span>
          </div>
          <div className="divide-y divide-slate-50">
            {officers.map(officer => (
              <div key={officer.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#800000]/5 flex items-center justify-center text-[#800000] group-hover:bg-[#800000] group-hover:text-white transition-all">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 group-hover:text-[#800000] transition-colors">{officer.rank}{officer.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">ชื่อเล่น: {officer.nick_name}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Star size={10} /> {officer.specialty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleDelete(officer.id, officer.nick_name)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
