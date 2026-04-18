import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. ตรวจสอบความปลอดภัย (ป้องกันคนอื่นมาแอบเรียก API นี้เล่น)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. ดึงข้อมูลเวรวันนี้
    const today = new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"});
    const dateString = new Date(today).toISOString().split('T')[0];
    
    const { data: duty, error } = await supabase
      .from('duty_roster')
      .select('*')
      .eq('duty_date', dateString)
      .maybeSingle();

    if (!duty) {
      return NextResponse.json({ message: 'No duty today' });
    }

    // 3. เตรียมข้อความแจ้งเตือน
    const message = `📢 ประกาศแจ้งเวรปฏิบัติการประจำวันนี้\n🗓️ วันที่: ${new Date(duty.duty_date).toLocaleDateString('th-TH')}\n\n👮‍♂️ ผู้เข้าเวรวันนี้คือ:\n${duty.officer_name}\n\n⚠️ แจ้งเตือน: โปรดเตรียมความพร้อมและเริ่มปฏิบัติหน้าที่ของท่านได้แล้วครับ!\n\n📞 เบอร์ติดต่อ: ${duty.phone}\n#GGS2 #DutyReminder`;

    // 4. ส่งข้อความเข้า LINE (ส่งเข้ากลุ่มที่ตั้งค่าไว้)
    const targetId = process.env.LINE_GROUP_ID; // ต้องไปตั้งใน Vercel
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!targetId || !token) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

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

    return NextResponse.json({ success: res.ok, date: dateString, officer: duty.officer_name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
