import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('⏰ --- CRON START: Duty Reminder ---');

  // 1. ตรวจสอบความปลอดภัย
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === 'true';
  const cronSecret = process.env.CRON_SECRET;

  console.log('Checking Auth...');
  if (authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    console.error('❌ Unauthorized Attempt');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. ดึงวันที่วันนี้ (เวลาไทย)
    const now = new Date();
    const dateString = new Intl.DateTimeFormat('fr-CA', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    
    console.log(`📅 Target Date (Bangkok): ${dateString}`);

    // 3. ดึงข้อมูลเวรจาก Supabase
    console.log('Searching database for duty...');
    const { data: duty, error: dbError } = await supabase
      .from('duty_roster')
      .select('*')
      .eq('duty_date', dateString)
      .maybeSingle();

    if (dbError) {
      console.error('❌ Supabase Error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!duty) {
      console.log('ℹ️ No duty found for today. Skipping notification.');
      return NextResponse.json({ message: 'No duty scheduled for today', date: dateString });
    }

    console.log(`👤 Duty found: ${duty.officer_name}`);

    // 4. ตรวจสอบ Config ของ LINE
    const targetId = process.env.LINE_GROUP_ID;
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!targetId || !token) {
      console.error('❌ Missing LINE Config (LINE_GROUP_ID or TOKEN)');
      throw new Error('LINE Configuration missing in Environment Variables');
    }

    // 5. ส่งข้อความเข้า LINE
    console.log('Sending message to LINE Group...');
    const message = `📢 ประกาศแจ้งเวรปฏิบัติการประจำวันนี้\n🗓️ วันที่: ${new Date(duty.duty_date).toLocaleDateString('th-TH')}\n\n👮‍♂️ ผู้เข้าเวรวันนี้คือ:\n${duty.officer_name}\n\n⚠️ แจ้งเตือน: โปรดเตรียมความพร้อมและเริ่มปฏิบัติหน้าที่ของท่านได้แล้วครับ!\n\n📞 เบอร์ติดต่อ: ${duty.phone}\n#GGS2 #DutyReminder`;

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: targetId,
        messages: [{ type: 'text', text: message }]
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ LINE API Response Error:', errorData);
      throw new Error(`LINE API responded with ${res.status}`);
    }

    console.log('✅ Cron Job Successfully Completed!');
    return NextResponse.json({ success: true, officer: duty.officer_name });

  } catch (error: any) {
    console.error('❌ CRON FATAL ERROR:', error.message);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
