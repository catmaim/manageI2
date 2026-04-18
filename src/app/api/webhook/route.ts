import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      const eventSource = event.source;
      const type = eventSource.type; // 'user', 'group', or 'room'
      const replyToken = event.replyToken;
      const senderId = eventSource.userId; // ไอดีคนพิมพ์จริง (U...) เสมอ
      
      // ระบุว่าต้องตอบกลับไปที่ไหน (ถ้าคุยในกลุ่มก็คือ Group ID, ถ้าคุยส่วนตัวก็คือ User ID)
      let targetId = '';
      if (type === 'group') targetId = eventSource.groupId;
      else if (type === 'room') targetId = eventSource.roomId;
      else targetId = senderId;

      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();

        // --- 🔍 ค้นหาข้อมูลเจ้าหน้าที่จาก senderId (U...) ---
        const { data: currentOfficer } = await supabase
          .from('officers')
          .select('id, nick_name, rank, name, line_status')
          .eq('line_user_id', senderId)
          .maybeSingle();

        // 1. คำสั่งพื้นฐาน (ทำงานทั้งในกลุ่มและส่วนตัว)
        if (text === 'ช่วยเหลือ' || text === 'วิธีใช้' || text === 'help') {
          await replyLine(replyToken, `📋 คู่มือการใช้งาน GGS2 Bot\n\n1️⃣ ลงทะเบียน:\nพิมพ์ "ลงทะเบียน [ชื่อเล่น]"\n\n2️⃣ เช็คเวรวันนี้:\nพิมพ์ "ใครอยู่เวร"\n\n3️⃣ เช็คไอดี:\nพิมพ์ "เช็คไอดี"\n\n4️⃣ เช็คชื่อตัวเอง:\nพิมพ์ "ผมชื่ออะไร"`, token);
        }
        else if (text === 'เช็คไอดี') {
          await replyLine(replyToken, `🆔 ID ห้องนี้คือ:\n${targetId}\n\n👤 ID ของคุณคือ:\n${senderId}`, token);
        }
        else if (text === 'ผมชื่ออะไร' || text === 'who am i') {
          if (currentOfficer) {
            await replyLine(replyToken, `👤 ข้อมูลของคุณในระบบ:\n\n👮‍♂️ ชื่อ: ${currentOfficer.rank}${currentOfficer.name}\n🔹 ชื่อเล่น: ${currentOfficer.nick_name}\n✅ สถานะ: ${currentOfficer.line_status}\n🆔 LINE ID: ${senderId}`, token);
          } else {
            await replyLine(replyToken, `❌ ระบบยังไม่รู้จักคุณครับ\n\nรหัสของคุณคือ: ${senderId}\nกรุณาพิมพ์ "ลงทะเบียน [ชื่อเล่น]" เพื่อยืนยันตัวตนครับ`, token);
          }
        }
        else if (text === 'ใครอยู่เวร' || text === 'เวรวันนี้') {
          const today = new Date().toISOString().split('T')[0];
          const { data: duty } = await supabase.from('duty_roster').select('*').eq('duty_date', today).maybeSingle();
          if (duty) {
            await replyLine(replyToken, `👮‍♂️ เจ้าหน้าที่เวรวันนี้คือ:\n${duty.officer_name}\n📞 ติดต่อ: ${duty.phone}`, token);
          } else {
            await replyLine(replyToken, `📅 วันนี้ยังไม่มีข้อมูลในตารางเวรครับ`, token);
          }
        }
        // 2. การลงทะเบียน (ต้องพิม: ลงทะเบียน [ชื่อเล่น])
        else if (text.startsWith('ลงทะเบียน')) {
          const nickname = text.replace('ลงทะเบียน', '').trim();
          if (!nickname) {
            await replyLine(replyToken, "กรุณาระบุชื่อเล่นด้วยครับ เช่น 'ลงทะเบียน บิว'", token);
          } else {
            const { data } = await supabase
              .from('officers')
              .update({ line_user_id: senderId, line_status: 'pending' })
              .ilike('nick_name', `%${nickname}%`)
              .select();

            if (data && data.length > 0) {
              await replyLine(replyToken, `📝 รับคำขอลงทะเบียนของ "${data[0].nick_name}" แล้วครับ\n\n⚠️ สถานะ: [รอแอดมินอนุมัติ]\nแอดมินจะทำการยืนยันตัวตนให้คุณในระบบเร็วๆ นี้ครับ`, token);
              await supabase.from('system_logs').insert([{ log_type: 'AUTH_REQUEST', message: `📢 คำขอใหม่: ${data[0].nick_name}`, details: { sender: senderId, officer_id: data[0].id } }]);
            } else {
              await replyLine(replyToken, `❌ ไม่พบชื่อเล่น "${nickname}" ในระบบครับ\nรบกวนเช็คชื่อเล่นในหน้า Dashboard หรือติดต่อแอดมินครับ`, token);
            }
          }
        }
        // 3. กรณีคุยทั่วไป (เงียบในกลุ่ม, ตอบในแชทส่วนตัว)
        else if (type === 'user') {
          if (!currentOfficer) {
            await replyLine(replyToken, "สวัสดีครับ! ผมยังไม่รู้จักคุณครับ 🤖\n\nพิมพ์ 'ลงทะเบียน [ชื่อเล่น]' เพื่อรายงานตัวเข้าสู่ระบบนะครับ", token);
          } else if (currentOfficer.line_status === 'pending') {
            await replyLine(replyToken, "⏳ บัญชีของคุณอยู่ระหว่าง [รอแอดมินอนุมัติ]\nโปรดรอสักครู่ หรือติดต่อหัวหน้ากฤษกรครับ", token);
          }
        }

        // --- 📊 บันทึก Log ทุกการเคลื่อนไหว ---
        const officerDisplayName = currentOfficer ? `${currentOfficer.rank}${currentOfficer.nick_name}` : 'Unknown';
        await supabase.from('system_logs').insert([{ 
          log_type: 'LINE_MSG', 
          message: `💬 [${officerDisplayName}] ${text}`, 
          details: { 
            target: targetId, 
            sender: senderId, 
            type: type,
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
  if (!token) return { success: false };
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: message }] }),
    });
    return { success: response.ok };
  } catch (error) {
    return { success: false };
  }
}
