const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://omnvpmltbrfjhgoahqtk.supabase.co';
const supabaseKey = 'sb_publishable_I14K2PDCHTZXoLJbe0FrPg_lDkm5t7n';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOfficers() {
  console.log('--- กำลังดึงข้อมูลจาก Supabase ---');
  const { data, error } = await supabase
    .from('officers')
    .select('id, name, nick_name, line_user_id, line_status');

  if (error) {
    console.error('เกิดข้อผิดพลาด:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('ไม่พบข้อมูลเจ้าหน้าที่ในตาราง officers');
    return;
  }

  console.log(`พบเจ้าหน้าที่ทั้งหมด ${data.length} นาย:`);
  console.table(data.map(o => ({
    'ชื่อ': o.name,
    'ชื่อเล่น': o.nick_name,
    'Line ID': o.line_user_id ? '✅ มีแล้ว' : '❌ ไม่มี',
    'สถานะ': o.line_status,
    'Line User ID': o.line_user_id || '-'
  })));
}

checkOfficers();
