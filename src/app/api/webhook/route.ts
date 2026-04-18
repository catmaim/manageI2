import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// --- 🛠️ HELPER FUNCTIONS ---
async function replyText(replyToken: string, message: string, token: string | undefined) {
  if (!token) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: message }] }),
  });
}

async function replyFlex(replyToken: string, altText: string, contents: any, token: string | undefined) {
  if (!token) return;
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'flex', altText, contents }] }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    // 💡 แก้ไข: ให้ Log error ลง Console แทน เพราะ replyToken ถูก LINE ยกเลิกไปแล้ว จะตอบกลับซ้ำไม่ได้
    console.error('❌ LINE Flex Error:', JSON.stringify(err, null, 2));
  }
}

// --- 🚀 WEBHOOK HANDLER ---
export async function POST(request: Request) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;
      const replyToken = event.replyToken;
      const text = event.message.text.trim();
      const senderId = event.source.userId;
      const source = event.source;

      // 🕵️‍♂️ Fetch LINE Profile
      let lineProfile = { displayName: 'Unknown', pictureUrl: 'https://img5.pic.in.th/file/secure-sv1/police-logo.png' };
      if (senderId) {
        const pRes = await fetch(`https://api.line.me/v2/bot/profile/${senderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) {
          const p = await pRes.json();
          lineProfile.displayName = p.displayName || 'Unknown';
          lineProfile.pictureUrl = p.pictureUrl || lineProfile.pictureUrl;
        }
      }

      // 🔍 Fetch Database Officer Info
      const { data: officer } = await supabase
        .from('officers')
        .select('id, nick_name, rank, name, line_status')
        .eq('line_user_id', senderId)
        .maybeSingle();

      // 📊 Log immediately
      const logName = officer ? officer.nick_name : lineProfile.displayName;
      await supabase.from('system_logs').insert([{ 
        log_type: 'LINE_MSG', message: `💬 [${logName}] ${text}`, 
        details: { target: source.type === 'group' ? source.groupId : senderId, sender: senderId, line_name: lineProfile.displayName, officer_name: officer?.nick_name || null } 
      }]);
      
      // --- 🕹️ COMMANDS LOGIC ---

      // 1. ผมชื่ออะไร (Digital Badge)
      if (text === 'ผมชื่ออะไร') {
        const badgeColor = officer?.line_status === 'approved' ? "#064e3b" : "#800000";
        const badgeStatus = officer?.line_status === 'approved' ? "✅ ยืนยันตัวตนสำเร็จ" : "⏳ รออนุมัติ";
        
        const badgeFlex = {
          type: "bubble",
          // 🖼️ เพิ่มบล็อก hero เพื่อแสดงรูปโปรไฟล์ขนาดใหญ่เต็มหน้ากว้าง
          hero: {
            type: "image",
            url: lineProfile.pictureUrl,
            size: "full",
            aspectRatio: "1:1", // บังคับรูปเป็นสี่เหลี่ยมจัตุรัส
            aspectMode: "cover" // ไม่ให้รูปเบี้ยว
          },
          body: {
            type: "box", layout: "vertical", backgroundColor: badgeColor, paddingAll: "0px",
            contents: [
              // 📝 ส่วนที่ 1: ข้อมูลส่วนตัว (จัดกึ่งกลางให้เข้ากับรูปใหญ่)
              {
                type: "box", layout: "vertical", paddingAll: "20px",
                contents: [
                  { type: "text", text: officer?.nick_name || lineProfile.displayName, color: "#ffffff", weight: "bold", size: "xl", align: "center" },
                  { type: "text", text: officer ? `${officer.rank || ''}${officer.name || ''}` : "ยังไม่ได้ลงทะเบียน", color: "#ffffff", size: "sm", opacity: 0.8, wrap: true, align: "center", margin: "sm" },
                  { type: "text", text: badgeStatus, color: "#ffd700", size: "md", weight: "bold", align: "center", margin: "md" }
                ]
              },
              // 🔘 ส่วนที่ 2: ไอดี และ ปุ่มกด
              { 
                type: "box", layout: "vertical", paddingAll: "15px", backgroundColor: "#00000033", 
                contents: [
                  { type: "text", text: `ID: ${senderId}`, color: "#ffffff", opacity: 0.4, size: "xxs", wrap: true, align: "center" },
                  { type: "button", action: { type: "uri", label: "📍 รายงานตัว (GPS)", uri: "https://manage-i2-snowy.vercel.app/verify" }, style: "primary", color: "#555555", margin: "md", height: "sm" }
                ]
              }
            ]
          }
        };
        await replyFlex(replyToken, "Digital Badge GGS2", badgeFlex, token);
      }
      // 2. วิธีใช้
      else if (text === 'วิธีใช้' || text === 'help' || text === 'ช่วยเหลือ') {
        await replyText(replyToken, "📋 คำสั่งที่ใช้ได้:\n1. ลงทะเบียน [ชื่อเล่น]\n2. ใครอยู่เวร\n3. เช็คไอดี\n4. ผมชื่ออะไร", token);
      }
      // 3. เช็คไอดี
      else if (text === 'เช็คไอดี') {
        const target = source.type === 'group' ? source.groupId : senderId;
        await replyText(replyToken, `🆔 ห้องนี้คือ: ${target}\n👤 คุณคือ: ${senderId}`, token);
      }
      // 4. ใครอยู่เวร
      else if (text === 'ใครอยู่เวร') {
        const today = new Date().toISOString().split('T')[0];
        const { data: duty } = await supabase.from('duty_roster').select('officer_name').eq('duty_date', today).maybeSingle();
        await replyText(replyToken, duty ? `👮‍♂️ เวรวันนี้: ${duty.officer_name}` : "📅 ยังไม่มีข้อมูลเวรครับ", token);
      }
      // 5. ลงทะเบียน [ชื่อเล่น]
      else if (text.startsWith('ลงทะเบียน')) {
        const nick = text.replace('ลงทะเบียน', '').trim();
        if (!nick) { await replyText(replyToken, "กรุณาระบุชื่อเล่นด้วยครับ", token); }
        else if (officer) { await replyText(replyToken, `⚠️ คุณลงทะเบียนแล้วในชื่อ "${officer.nick_name}"`, token); }
        else {
          const { data: nameTaken } = await supabase.from('officers').select('id').ilike('nick_name', `%${nick}%`).not('line_user_id', 'is', null).maybeSingle();
          if (nameTaken) { await replyText(replyToken, `❌ ชื่อ "${nick}" มีผู้ใช้อื่นลงทะเบียนแล้วครับ`, token); }
          else {
            const { data } = await supabase.from('officers').update({ line_user_id: senderId, line_status: 'pending', line_display_name: lineProfile.displayName }).ilike('nick_name', `%${nick}%`).select();
            if (data?.length) { await replyText(replyToken, `📝 รับคำขอของ "${nick}" แล้ว โปรดรอแอดมินอนุมัติครับ`, token); }
            else { await replyText(replyToken, `❌ ไม่พบชื่อ "${nick}" ในระบบครับ`, token); }
          }
        }
      }
      // 6. กรณีคุยส่วนตัว (ถ้ายังไม่ลงทะเบียน)
      else if (source.type === 'user' && !officer) {
        await replyText(replyToken, `สวัสดีครับคุณ ${lineProfile.displayName}! 🤖\n\nรบกวนพิมพ์ "ลงทะเบียน [ชื่อเล่น]" เพื่อเริ่มต้นใช้งานนะครับ`, token);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    return NextResponse.json({ success: false });
  }
}