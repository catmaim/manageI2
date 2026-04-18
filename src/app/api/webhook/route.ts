import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      const eventSource = event.source;
      const type = eventSource.type;
      const replyToken = event.replyToken;
      
      let targetId = '';
      if (type === 'group') targetId = eventSource.groupId;
      else if (type === 'room') targetId = eventSource.roomId;
      else targetId = eventSource.userId;

      const senderId = eventSource.userId;

      // --- 1. Handle Follow Event ---
      if (event.type === 'follow') {
        const { data: officers } = await supabase.from('officers').select('nick_name').limit(3);
        const exampleName = officers?.[0]?.nick_name || 'กอล์ฟ';
        await replyLine(replyToken, `สวัสดีครับ! ผมคือ GGS2 Assistant 🛡️👮‍♂️\n\n🔹 วิธีลงทะเบียน 🔹\nพิมพ์คำว่า: ลงทะเบียน [ชื่อเล่น]\n\nตัวอย่างเช่น:\n👉 ลงทะเบียน ${exampleName}\n\n⚠️ ชื่อเล่นต้องตรงกับในระบบนะครับ!`, token);
        continue;
      }

      // --- 2. Handle Message Event ---
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();

        // คำสั่ง: ช่วยเหลือ / วิธีใช้
        if (text === 'ช่วยเหลือ' || text === 'วิธีใช้' || text === 'help') {
          await replyLine(replyToken, `📋 คู่มือการใช้งาน GGS2 Bot\n\n1️⃣ ลงทะเบียนรับงาน:\nพิมพ์ "ลงทะเบียน [ชื่อเล่น]"\nเช่น "ลงทะเบียน กอล์ฟ"\n\n2️⃣ เช็คว่าใครอยู่เวรวันนี้:\nพิมพ์ "ใครอยู่เวร"\n\n3️⃣ ดูไอดีห้อง (สำหรับแอดมิน):\nพิมพ์ "เช็คไอดี"`, token);
        }
        // คำสั่ง: เช็คไอดี
        else if (text === 'เช็คไอดี') {
          await replyLine(replyToken, `🆔 ID ของคุณ/ห้องนี้คือ:\n${targetId}`, token);
        }
        // คำสั่ง: ใครอยู่เวร
        else if (text === 'ใครอยู่เวร' || text === 'เวรวันนี้') {
          const today = new Date().toISOString().split('T')[0];
          const { data: duty } = await supabase.from('duty_roster').select('*').eq('duty_date', today).maybeSingle();
          if (duty) {
            await replyLine(replyToken, `👮‍♂️ เจ้าหน้าที่เวรวันนี้คือ:\n${duty.officer_name}\n📞 ติดต่อ: ${duty.phone}`, token);
          } else {
            await replyLine(replyToken, `📅 วันนี้ยังไม่มีเจ้าหน้าที่เวรในระบบครับ`, token);
          }
        }
        // คำสั่ง: ลงทะเบียน
        else if (text.startsWith('ลงทะเบียน')) {
          const nickname = text.replace('ลงทะเบียน', '').trim();
          if (!nickname) {
            await replyLine(replyToken, "กรุณาระบุชื่อเล่นด้วยครับ เช่น 'ลงทะเบียน บิว'", token);
          } else {
            const { data } = await supabase.from('officers').update({ line_user_id: senderId }).ilike('nick_name', `%${nickname}%`).select();
            if (data && data.length > 0) {
              await replyLine(replyToken, `✅ ลงทะเบียนสำเร็จ!\n👮‍♂️ ยินดีรับใช้ครับคุณ ${data[0].nick_name}`, token);
            } else {
              await replyLine(replyToken, `❌ ไม่พบชื่อเล่น "${nickname}" ในระบบครับ`, token);
            }
          }
        }
        // กรณีทักทายทั่วไป (ถ้ายังไม่ได้ลงทะเบียน)
        else {
          const { data: officer } = await supabase.from('officers').select('id').eq('line_user_id', senderId).maybeSingle();
          if (!officer) {
            await replyLine(replyToken, "สวัสดีครับ! ผมยังไม่รู้จักคุณครับ 🤖\n\nรบกวนช่วยพิมพ์ 'ลงทะเบียน [ชื่อเล่น]' เพื่อรับแจ้งเตือนครับ\n\n(พิมพ์ 'วิธีใช้' เพื่อดูคำสั่งทั้งหมด)", token);
          }
        }

        // --- ค้นหาชื่อเล่นเพื่อเก็บ Log ให้ดูง่าย ---
        const { data: currentOfficer } = await supabase
          .from('officers')
          .select('nick_name, rank, name')
          .eq('line_user_id', senderId)
          .maybeSingle();

        const officerDisplayName = currentOfficer 
          ? `${currentOfficer.rank}${currentOfficer.nick_name}`
          : 'Unknown User';

        // เก็บ Log ลง Supabase
        await supabase.from('system_logs').insert([{ 
          log_type: 'LINE_MSG', 
          message: `💬 [${officerDisplayName}] พิมพ์ว่า: ${text}`, 
          details: { 
            id: targetId, 
            type: type, 
            sender: senderId,
            officer_name: currentOfficer?.nick_name || null 
          }
        }]);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ success: false });
  }
}

async function replyLine(replyToken: string, message: string, token: string | undefined) {
  if (!token) return { success: false, error: 'Token missing' };
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text: message }]
      }),
    });
    return { success: response.ok };
  } catch (error) {
    return { success: false, error };
  }
}
