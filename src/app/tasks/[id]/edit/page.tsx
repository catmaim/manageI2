"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Send, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Params = Promise<{ id: string }>;

export default function EditTaskPage({ params }: { params: Params }) {
  const { id } = use(params);
  const router = useRouter();
  const [officers, setOfficers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    crime_category: 'Other',
    assigned_to: '',
    difficulty_score: 3,
    due_date: ''
  });

  useEffect(() => {
    async function fetchData() {
      // Fetch Officers
      const { data: oData } = await supabase.from('officers').select('*');
      if (oData) setOfficers(oData);

      // Fetch existing task
      const { data: tData } = await supabase.from('tasks').select('*').eq('id', id).single();
      if (tData) {
        setFormData({
          title: tData.title,
          description: tData.description || '',
          crime_category: tData.crime_category || 'Other',
          assigned_to: tData.assigned_to || '',
          difficulty_score: tData.difficulty_score || 3,
          due_date: tData.due_date || ''
        });
      }
    }
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('tasks')
      .update({
        title: formData.title,
        description: formData.description,
        crime_category: formData.crime_category,
        assigned_to: formData.assigned_to,
        difficulty_score: formData.difficulty_score,
        due_date: formData.due_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    setIsSubmitting(false);

    if (error) {
      alert('Error updating: ' + error.message);
    } else {
      setIsSuccess(true);
      setTimeout(() => router.push('/tasks'), 1500);
    }
  };

  const handleDelete = async () => {
    if (!confirm('ยืนยันที่จะลบภารกิจนี้ออกจากระบบ?')) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    setIsDeleting(false);

    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      router.push('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/tasks" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#800000] mb-6 transition-colors text-sm font-bold bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <ChevronLeft size={16} /> ยกเลิก
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#800000] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md text-yellow-400"><ShieldAlert size={24} /></div>
               <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">แก้ไขข้อมูลภารกิจ</h1>
                  <p className="text-xs text-red-100/70 tracking-widest">Update Intelligence Data</p>
               </div>
            </div>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500/20 hover:bg-red-500 text-white p-3 rounded-xl transition-all border border-red-500/30"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {isSuccess ? (
            <div className="p-20 text-center animate-in zoom-in-95 duration-300">
              <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">อัปเดตข้อมูลสำเร็จ!</h2>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">หัวข้องาน / ชื่อคดี</label>
                <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#800000] outline-none font-bold text-slate-800"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ประเภทความผิด</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    value={formData.crime_category} onChange={(e) => setFormData({...formData, crime_category: e.target.value})}>
                    <option value="Gambling">เว็บพนัน (Gambling)</option>
                    <option value="Scam">หลอกลวง (Scam)</option>
                    <option value="Porn">สื่อลามก (Porn)</option>
                    <option value="Gun">ปืนออนไลน์ (Online Gun)</option>
                    <option value="Field Ops">งานสนาม (Field Ops)</option>
                    <option value="Admin">งานสารบรรณ (Admin)</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ผู้รับผิดชอบหลัก</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}>
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>{o.nick_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">รายละเอียดงาน</label>
                <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#800000] outline-none text-slate-700 font-medium"
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ระดับความยาก (1-5)</label>
                  <input type="range" min="1" max="5" className="w-full h-12 accent-[#800000]"
                    value={formData.difficulty_score} onChange={(e) => setFormData({...formData, difficulty_score: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">กำหนดส่ง (Deadline)</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-[#800000] text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                {isSubmitting ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : 'บันทึกการแก้ไขภารกิจ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
