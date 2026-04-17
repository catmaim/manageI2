"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewTaskPage() {
  const router = useRouter();
  const [officers, setOfficers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    assignedToId: '',
    difficultyScore: 3,
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    async function fetchOfficers() {
      const { data } = await supabase.from('officers').select('*');
      if (data && data.length > 0) {
        setOfficers(data);
        setFormData(prev => ({ ...prev, assignedToId: data[0].id }));
      }
    }
    fetchOfficers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assignedToId) return alert('กรุณาเลือกผู้รับผิดชอบ');
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: formData.title,
          description: formData.description,
          crime_category: formData.category,
          assigned_to: formData.assignedToId,
          difficulty_score: formData.difficultyScore,
          due_date: formData.dueDate,
          status: 'To Do'
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      console.error('Error saving task:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } else {
      setIsSuccess(true);
      setTimeout(() => router.push('/tasks'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/tasks" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#800000] mb-6 transition-colors text-sm font-bold bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <ChevronLeft size={16} /> ยกเลิกและกลับ
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#800000] p-6 text-white flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <ShieldAlert size={24} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">มอบหมายภารกิจใหม่ (Live Cloud)</h1>
              <p className="text-xs text-red-100/70">กก.สส.2 บก.สส.ภ.8 | บันทึกข้อมูลลงถังจริง</p>
            </div>
          </div>

          {isSuccess ? (
            <div className="p-20 text-center animate-in zoom-in-95 duration-300">
              <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">บันทึกลง Cloud สำเร็จ!</h2>
              <p className="text-slate-500">ภารกิจถูกส่งเข้าฐานข้อมูลเรียบร้อยแล้ว...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">หัวข้องาน / ชื่อคดี</label>
                <input 
                  required
                  type="text" 
                  placeholder="เช่น วิเคราะห์เครือข่ายเว็บพนันออนไลน์..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent outline-none transition-all font-bold text-slate-800"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ประเภทความผิด</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
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
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                  >
                    <option value="" disabled>เลือกเจ้าหน้าที่...</option>
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>{o.nick_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">รายละเอียดงานเชิงลึก</label>
                <textarea 
                  rows={4}
                  placeholder="ระบุวัตถุประสงค์และขอบเขตงาน..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent outline-none transition-all text-slate-700 font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ระดับความยาก (1-5 ดาว)</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <input 
                       type="range" min="1" max="5" step="1"
                       className="flex-grow accent-[#800000]"
                       value={formData.difficultyScore}
                       onChange={(e) => setFormData({...formData, difficultyScore: parseInt(e.target.value)})}
                     />
                     <span className="font-black text-[#800000] w-8 text-center text-xl">{formData.difficultyScore}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">กำหนดส่ง (Deadline)</label>
                  <input 
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#800000] text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-800 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    ยืนยันการมอบหมายภารกิจ <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
