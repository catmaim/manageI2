"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Phone, User, ArrowLeft, Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const officerRotation = [
  { name: 'ส.ต.ต.ณัฐภัทร บุญต่อ (บิว)', pos: 'ผบ.หมู่ คฝ.กก.ปพ.บก.สส.ภ.8', phone: '0990300304' },
  { name: 'ส.ต.ต.ศักรินทร์ ผลหิรัญ (อาร์ม)', pos: 'ผบ.หมู่ คฝ.กก.ปพ.บก.สส.ภ.8', phone: '0612486072' },
  { name: 'ส.ต.ต.ชินภัทร นิลวานิช (ยีนส์)', pos: 'ผบ.หมู่ คฝ.กก.ปพ.บก.สส.ภ.8', phone: '0843638065' },
  { name: 'ส.ต.ต.พรมงคล บัวแก้ว (ตั้ม)', pos: 'ผบ.หมู่ คฝ.กก.ปพ.บก.สส.ภ.8', phone: '0993833533' },
  { name: 'ส.ต.ต.คมกฤช คำพุต (กฤช)', pos: 'ผบ.หมู่ คฝ.กก.ปพ.บก.สส.ภ.8', phone: '0955841590' },
];

export default function ManageRosterPage() {
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-Gen State
  const [autoGen, setAutoGen] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Manual Form State
  const [formData, setFormData] = useState({
    duty_date: new Date().toISOString().split('T')[0],
    officer_name: '',
    position: 'ผบ.หมู่ คฝ.กก.ปพ.บก.สส.ภ.8',
    phone: '',
    remarks: ''
  });

  useEffect(() => {
    fetchRoster();
  }, []);

  async function fetchRoster() {
    setLoading(true);
    const { data } = await supabase
      .from('duty_roster')
      .select('*')
      .order('duty_date', { ascending: true });
    if (data) setRoster(data);
    setLoading(false);
  }

  async function handleAutoGenerate() {
    if (!confirm('ระบบจะสร้างตารางเวรตามลำดับการวน 5 นายในช่วงวันที่ระบุ ยืนยันหรือไม่?')) return;
    
    setSaving(true);
    const start = new Date(autoGen.startDate);
    const end = new Date(autoGen.endDate);
    const duties = [];
    
    let currentDate = new Date(start);
    let rotationIndex = 0;

    while (currentDate <= end) {
      const officer = officerRotation[rotationIndex % officerRotation.length];
      duties.push({
        duty_date: currentDate.toISOString().split('T')[0],
        officer_name: officer.name,
        position: officer.pos,
        phone: officer.phone
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
      rotationIndex++;
    }

    const { error } = await supabase.from('duty_roster').insert(duties);
    
    if (error) {
      setMessage({ type: 'error', text: 'ผิดพลาด: ' + error.message });
    } else {
      setMessage({ type: 'success', text: `สร้างตารางเวรสำเร็จ ${duties.length} รายการ` });
      fetchRoster();
    }
    setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('duty_roster')
      .insert([formData]);

    if (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จแล้ว' });
      setFormData({ ...formData, officer_name: '', phone: '' });
      fetchRoster();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบรายการนี้หรือไม่?')) return;

    const { error } = await supabase
      .from('duty_roster')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    } else {
      fetchRoster();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-[#800000] text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/duty-roster" className="bg-white p-2 rounded-full shadow-inner hover:scale-110 transition-transform">
            <ArrowLeft className="text-[#800000]" size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">จัดการข้อมูลตารางเวร</h1>
            <p className="text-[10px] text-[#ffd700] font-bold uppercase tracking-widest">Admin Control Panel</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Auto-Gen Section */}
        <section className="bg-[#800000] rounded-3xl shadow-xl border border-[#800000] overflow-hidden">
          <div className="bg-white/10 p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Calendar size={18} className="text-[#ffd700]" />
              สร้างตารางเวรอัตโนมัติ (ระบบวน 5 นาย)
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/50 uppercase">วันที่เริ่มต้น</label>
              <input 
                type="date" 
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-sm outline-none focus:border-[#ffd700]"
                value={autoGen.startDate}
                onChange={(e) => setAutoGen({...autoGen, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/50 uppercase">วันที่สิ้นสุด</label>
              <input 
                type="date" 
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-sm outline-none focus:border-[#ffd700]"
                value={autoGen.endDate}
                onChange={(e) => setAutoGen({...autoGen, endDate: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleAutoGenerate}
                disabled={saving}
                className="w-full p-2.5 bg-[#ffd700] text-[#800000] rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
              >
                เริ่มสร้างตารางเวร
              </button>
            </div>
          </div>
        </section>

        {/* Manual Form Section */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Plus size={18} className="text-[#800000]" />
              เพิ่มรายการเวรใหม่
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">วันที่ปฏิบัติหน้าที่</label>
              <input 
                type="date" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#800000] outline-none"
                value={formData.duty_date}
                onChange={(e) => setFormData({...formData, duty_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">ชื่อ-สกุล (ชื่อเล่น)</label>
              <input 
                type="text" 
                placeholder="ส.ต.ต. ณัฐภัทร (บิว)"
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#800000] outline-none"
                value={formData.officer_name}
                onChange={(e) => setFormData({...formData, officer_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">ตำแหน่ง</label>
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#800000] outline-none"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">เบอร์โทรติดต่อ</label>
              <input 
                type="text" 
                placeholder="099xxxxxxx"
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#800000] outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-4 bg-[#800000] text-[#ffd700] rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-[#600000] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : <><Save size={20} /> บันทึกลงระบบ GGS2</>}
              </button>
              {message.text && (
                <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}
            </div>
          </form>
        </section>

        {/* List Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
            <Calendar size={18} />
            รายการที่บันทึกไว้ในระบบ
          </h2>
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-bold">กำลังดึงข้อมูลล่าสุด...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {roster.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-red-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-slate-100 px-3 py-1 rounded-lg">
                      <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(item.duty_date).toLocaleDateString('th-TH', { month: 'short' })}</p>
                      <p className="text-lg font-black text-[#800000]">{new Date(item.duty_date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{item.officer_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
