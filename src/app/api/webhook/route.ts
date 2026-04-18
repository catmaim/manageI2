import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const events = body.events || [];
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    for (const event of events) {
      // ดึงค่าโดยตรงจาก event object
      const eventSource = event.source;
      const type = eventSource.type;
      
      // กำหนด ID ที่จะใช้ส่งข้อความ (Target)
      let targetId = '';
      if (type === 'group') targetId = eventSource.groupId;
      else if (type === 'room') targetId = eventSource.roomId;
      else targetId = eventSource.userId;

      const senderId = eventSource.userId; // ID ของคนพิม
      const replyToken = event.replyToken;

      // 1. Handle Follow Event (When someone adds the bot)
      if (event.type === 'follow') {
        const { data: officers } = await supabase.from('officers').select('nick_name').limit(3);
        const exampleName = officers?.[0]?.nick_name || 'กอล์ฟ';
        
        await replyLine(replyToken, `สวัสดีครับ! ผมคือ GGS2 Assistant 🛡️👮‍♂️\n\nเพื่อให้ผมส่งแจ้งเตือน "เวร" และ "งานด่วน" ให้พี่ๆ ได้ถูกต้อง รบกวนลงทะเบียนตามนี้ครับ:\n\n🔹 วิธีลงทะเบียน 🔹\nพิมพ์คำว่า: ลงทะเบียน [ชื่อเล่น]\n\nตัวอย่างเช่น:\n👉 ลงทะเบียน ${exampleName}\n👉 ลงทะเบียน ${officers?.[1]?.nick_name || 'เอ็ม'}\n\n⚠️ ชื่อเล่นต้องตรงกับในระบบ Dashboard นะครับ!`, token);
        continue;
      }

      // 2. Handle Message Event
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();

        // คำสั่ง: ช่วยเหลือ / วิธีใช้
        if (text === 'ช่วยเหลือ' || text === 'วิธีใช้' || text === 'help') {
            await replyLine(replyToken, `📋 คู่มือการใช้งาน GGS2 Bot\n\n1️⃣ ลงทะเบียนรับงาน:\nพิมพ์ "ลงทะเบียน [ชื่อเล่น]"\nเช่น "ลงทะเบียน กอล์ฟ"\n\n2️⃣ เช็คว่าใครอยู่เวรวันนี้:\nพิมพ์ "ใครอยู่เวร"\n\n3️⃣ ดูไอดีห้อง (สำหรับแอดมิน):\nพิมพ์ "เช็คไอดี"`, token);
            continue;
        }

        // คำสั่ง: เช็คไอดี
        if (text === 'เช็คไอดี') {
          await replyLine(replyToken, `🆔 ID ของคุณ/ห้องนี้คือ:\n${targetId}\n\n(ใช้สำหรับใส่ในหน้า Line Setup ของแอดมินครับ)`, token);
          continue;
        }

        // คำสั่ง: ใครอยู่เวร
        if (text === 'ใครอยู่เวร' || text === 'เวรวันนี้') {
          const today = new Date().toISOString().split('T')[0];
          const { data: duty } = await supabase.from('duty_roster').select('*').eq('duty_date', today).single();
          if (duty) {
            await replyLine(replyToken, `👮‍♂️ เจ้าหน้าที่เวรวันนี้คือ:\n${duty.officer_name}\n📞 ติดต่อ: ${duty.phone}`, token);
          } else {
            await replyLine(replyToken, `📅 วันนี้ยังไม่มีการระบุชื่อเจ้าหน้าที่เวรในระบบครับ`, token);
          }
          continue;
        }

        // Logic: ลงทะเบียน [ชื่อเล่น]
        if (text.startsWith('ลงทะเบียน')) {
          const nickname = text.replace('ลงทะเบียน', '').trim();
          
          if (!nickname) {
            await replyLine(replyToken, "กรุณาระบุชื่อเล่นด้วยครับ เช่น 'ลงทะเบียน บิว'", token);
            continue;
          }

          const { data, error } = await supabase
            .from('officers')
            .update({ line_user_id: senderId })
            .ilike('nick_name', `%${nickname}%`)
            .select();

          if (data && data.length > 0) {
            const officer = data[0];
            await replyLine(replyToken, `✅ ลงทะเบียนสำเร็จ!\n👮‍♂️ ยินดีรับใช้ครับ ${officer.rank}${officer.name} (คุณ${officer.nick_name})\n\nผมจะส่งการแจ้งเตือนงานและเวรให้คุณโดยตรงที่นี่ครับ!`, token);
          } else {
            await replyLine(replyToken, `❌ ไม่พบชื่อเล่น "${nickname}" ในฐานข้อมูล กก.สส.2 ครับ\n\nรบกวนตรวจสอบชื่อเล่นของคุณใน Dashboard หรือแจ้งแอดมินให้เพิ่มรายชื่อครับ`, token);
          }
          continue;
        } 
        // Logic: If someone says something else, check if they are registered
        else {
          const { data: officer } = await supabase
            .from('officers')
            .select('id, nick_name')
            .eq('line_user_id', senderId)
            .maybeSingle(); // ใช้ maybeSingle แทน single เพื่อไม่ให้ error ถ้าไม่พบ
          
          if (!officer && text !== 'เช็คไอดี') {
            const res = await replyLine(replyToken, "สวัสดีครับ! ผมยังไม่รู้จักคุณครับ 🤖\n\nรบกวนช่วยพิมพ์ 'ลงทะเบียน [ชื่อเล่น]' เพื่อให้ผมบันทึกข้อมูลและส่งแจ้งเตือนเวรให้คุณได้อย่างถูกต้องครับ\n\nตัวอย่าง: ลงทะเบียน กอล์ฟ", token);
            console.log('Reply result:', res);
          }
        }
        
        // Log detections for the Admin
        await supabase.from('system_logs').insert([{ 
          log_type: 'LINE_MSG', 
          message: `Text: ${text}`, 
          details: { 
            id: targetId, 
            type: type, 
            sender: senderId, 
            bot_dest: body.destination, 
            raw: body 
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
  if (!token) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
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
}
