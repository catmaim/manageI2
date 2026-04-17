import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omnvpmltbrfjhgoahqtk.supabase.co';
const supabaseAnonKey = 'sb_publishable_I14K2PDCHTZXoLJbe0FrPg_lDkm5t7n';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const officers = [
  { nick_name: 'กอล์ฟ(ใหญ่)', name: 'กฤษกร', rank: 'พ.ต.ท.', specialty: 'Field Lead' },
  { nick_name: 'เอ็ม', name: '-', rank: 'ร.ต.อ.', specialty: 'Generalist' },
  { nick_name: 'อั๋น', name: '-', rank: 'ร.ต.ท.', specialty: 'Investigation' },
  { nick_name: 'อาร์ม(ใหญ่)', name: '-', rank: 'พ.ต.ต.', specialty: 'Tech Lead' },
  { nick_name: 'อาร์ม(เล็ก)', name: '-', rank: 'จ.ส.ต.', specialty: 'Tech Support' },
  { nick_name: 'กอล์ฟ(เล็ก)', name: '-', rank: 'ส.ต.อ.', specialty: 'Scraper' },
  { nick_name: 'ยีนต์', name: '-', rank: 'ร.ต.ท.', specialty: 'Liaison' },
  { nick_name: 'บิว', name: '-', rank: 'ร.ต.อ.', specialty: 'Admin' },
  { nick_name: 'กฤต', name: '-', rank: 'ส.ต.ท.', specialty: 'Field Ops' },
  { nick_name: 'ตั้ม(เล็ก)', name: '-', rank: 'ส.ต.ต.', specialty: 'Assistant' },
  { nick_name: 'โจ้', name: '-', rank: 'จ.ส.ต.', specialty: 'Evidence' }
];

async function importOfficers() {
  console.log('🚀 กำลังนำเข้าข้อมูลเจ้าหน้าที่...');
  const { data, error } = await supabase.from('officers').insert(officers);
  if (error) {
    console.error('❌ ผิดพลาด:', error.message);
  } else {
    console.log('✅ นำเข้าข้อมูลเจ้าหน้าที่ 11 นายสำเร็จ!');
  }
}

importOfficers();
