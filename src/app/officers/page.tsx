"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Trash2, Shield, User, Star, ArrowLeft, Loader2, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function OfficersManagement() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // เพิ่ม state สำหรับเก็บ ID ที่กำลังแก้
  
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

    if (editingId) {
      // โหมดแก้ไข
      const { error } = await supabase
        .from('officers')
        .update(newOfficer)
        .eq('id', editingId);
      
      if (error) {
        alert('แก้ไขไม่สำเร็จ: ' + error.message);
      } else {
        alert('แก้ไขข้อมูลเรียบร้อย!');
        setEditingId(null);
      }
    } else {
      // โหมดเพิ่มใหม่
      const { error } = await supabase.from('officers').insert([newOfficer]);
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
      }
    }

    setNewOfficer({ rank: '', name: '', nick_name: '', specialty: '', unit: 'กก.สส.2' });
    fetchOfficers();
  };

  const handleEditClick = (officer: any) => {
    setNewOfficer({
      rank: officer.rank || '',
      name: officer.name || '',
      nick_name: officer.nick_name || '',
      specialty: officer.specialty || '',
      unit: officer.unit || 'กก.สส.2'
    });
    setEditingId(officer.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนขึ้นไปบนสุดเพื่อให้เห็นฟอร์ม
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`ยืนยันการลบข้อมูลของ ${name} หรือไม่?`)) {
      const { error } = await supabase.from('officers').delete().eq('id', id);
      if (!error) fetchOfficers();
    }
  };

  const handleApproveInline = async (officerId: string) => {
    const { error } = await supabase
      .from('officers')
      .update({ line_status: 'approved' })
      .eq('id', officerId);

    if (!error) {
      alert('อนุมัติเรียบร้อย!');
      fetchOfficers();
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
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setNewOfficer({ rank: '', name: '', nick_name: '', specialty: '', unit: 'กก.สส.2' });
          }}
          className="bg-[#ffd700] text-[#800000] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          {isAdding && !editingId ? 'ยกเลิก' : <><UserPlus size={16} /> เพิ่มคนใหม่</>}
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {/* Add/Edit Officer Form */}
        {isAdding && (
          <div className="mb-8 bg-white p-6 rounded-[32px] shadow-xl border-2 border-[#ffd700] animate-in zoom-in-95 duration-300">
            <h2 className="text-lg font-black mb-4 text-slate-800 flex items-center gap-2">
              <Shield className="text-[#800000]" size={20} />
              {editingId ? 'แก้ไขข้อมูลเจ้าหน้าที่' : 'บันทึกข้อมูลเจ้าหน้าที่ใหม่'}
            </h2>
            <form onSubmit={handleAddOfficer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ... (input fields remain the same) ... */}
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
                  {editingId ? 'บันทึกการแก้ไขข้อมูล' : 'บันทึกเข้าสู่ระบบ GGS2'}
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">ชื่อเล่น: {officer.nick_name}</span>
                      
                      {/* LINE STATUS BADGE */}
                      {officer.line_status === 'approved' ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">
                          <CheckCircle2 size={10} /> LINE ACTIVE
                        </span>
                      ) : officer.line_status === 'pending' ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase animate-pulse">
                          <Clock size={10} /> WAITING APPROVAL
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                          <MessageSquare size={10} /> NO LINE LINKED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* INLINE APPROVE BUTTON */}
                  {officer.line_status === 'pending' && (
                    <button 
                      onClick={() => handleApproveInline(officer.id)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-md active:scale-95 transition-all mr-2"
                    >
                      กดอนุมัติ
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleEditClick(officer)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#800000] hover:text-white transition-all"
                    >
                      แก้ไข
                    </button>
                    <button 
                      onClick={() => handleDelete(officer.id, officer.nick_name)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
