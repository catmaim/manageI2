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

    // 3. ค้นหาข้อมูลเจ้าหน้าที่เพื่อเอา LINE ID มา Tag
    console.log(`Searching for officer: ${duty.officer_name}`);
    const { data: officer } = await supabase
      .from('officers')
      .select('line_user_id, nick_name')
      .or(`name.eq."${duty.officer_name}",nick_name.eq."${duty.officer_name}"`)
      .eq('line_status', 'approved')
      .maybeSingle();

    // 4. เตรียมข้อความแจ้งเตือน (เพิ่มการ Tag ถ้ามี ID)
    let messageText = `📢 ประกาศแจ้งเวรปฏิบัติการประจำวันนี้\n🗓️ วันที่: ${new Date(duty.duty_date).toLocaleDateString('th-TH')}\n\n👮‍♂️ ผู้เข้าเวรวันนี้คือ: ${duty.officer_name}\n`;
    
    const mentions = [];
    if (officer?.line_user_id) {
      // เพิ่ม @Tag เข้าไปในข้อความ
      const tagPlaceholder = `@${officer.nick_name || 'เจ้าหน้าที่'}`;
      messageText += `👉 ${tagPlaceholder} เตรียมความพร้อมและเริ่มปฏิบัติหน้าที่ได้เลยครับ!\n`;
      
      mentions.push({
        index: messageText.indexOf(tagPlaceholder),
        length: tagPlaceholder.length,
        userId: officer.line_user_id
      });
    } else {
      messageText += `⚠️ แจ้งเตือน: โปรดเตรียมความพร้อมและเริ่มปฏิบัติหน้าที่ของท่านได้แล้วครับ!\n`;
    }

    messageText += `\n📞 เบอร์ติดต่อ: ${duty.phone}\n#GGS2 #DutyReminder`;

    // 5. ส่งข้อความเข้า LINE
    console.log('Sending message to LINE Group with Mentions...');
    const targetId = process.env.LINE_GROUP_ID;
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    const lineBody: any = {
      to: targetId,
      messages: [{ 
        type: 'text', 
        text: messageText
      }]
    };

    // ใส่ข้อมูล Mention ถ้ามี
    if (mentions.length > 0) {
      lineBody.messages[0].mention = { mentions };
    }

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(lineBody),
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
