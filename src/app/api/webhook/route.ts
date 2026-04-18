import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// --- 🛠️ 1. ฟังก์ชันตอบกลับแบบตัวหนังสือ (Safe Reply) ---
async function replyText(replyToken: string, message: string, token: string | undefined) {
  if (!token) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: message }] }),
  });
}

// --- 🛠️ 2. ฟังก์ชันตอบกลับแบบการ์ด (Flex Reply) ---
async function replyFlex(replyToken: string, altText: string, contents: any, token: string | undefined) {
  if (!token) return;
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'flex', altText, contents }] }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    console.error('Flex Error:', err);
    // ถ้าส่ง Flex ไม่ผ่าน ให้ส่งข้อความธรรมดาไปแทน เพื่อไม่ให้บอทเงียบ
    await replyText(replyToken, `❌ ระบบการ์ดขัดข้อง: ${JSON.stringify(err.message)}`, token);
  }
}

// --- 🚀 3. ระบบ Webhook หลัก ---
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

      // 🕵️‍♂️ ดึงโปรไฟล์ LINE
      let lineProfile = { displayName: 'Unknown', pictureUrl: 'https://img5.pic.in.th/file/secure-sv1/police-logo.png' };
      if (senderId) {
        const pRes = await fetch(`https://api.line.me/v2/bot/profile/${senderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) {
          const p = await pRes.json();
          lineProfile.displayName = p.displayName || lineProfile.displayName;
          lineProfile.pictureUrl = p.pictureUrl || lineProfile.pictureUrl;
        }
      }

      // 🔍 ค้นหาเจ้าหน้าที่
      const { data: currentOfficer } = await supabase
        .from('officers')
        .select('id, nick_name, rank, name, line_status')
        .eq('line_user_id', senderId)
        .maybeSingle();

      // --- 📊 บันทึก Log ทันที (ห้ามข้าม) ---
      const logName = currentOfficer ? currentOfficer.nick_name : lineProfile.displayName;
      await supabase.from('system_logs').insert([{ 
        log_type: 'LINE_MSG', 
        message: `💬 [${logName}] ${text}`, 
        details: { sender: senderId, line_name: lineProfile.displayName, officer_name: currentOfficer?.nick_name || null } 
      }]);

      // --- 🕹️ ระบบคำสั่ง ---
      
      // คำสั่ง: ผมชื่ออะไร
      if (text === 'ผมชื่ออะไร') {
        const badgeColor = currentOfficer?.line_status === 'approved' ? "#064e3b" : "#800000";
        
        const badgeFlex = {
          type: "bubble",
          body: {
            type: "box", layout: "vertical", backgroundColor: badgeColor,
            contents: [
              {
                type: "box", layout: "horizontal", paddingAll: "20px",
                contents: [
                  {
                    type: "box", layout: "vertical", flex: 1,
                    contents: [{ type: "image", url: lineProfile.pictureUrl, size: "full", aspectRatio: "1:1", aspectMode: "cover", cornerRadius: "xl" }]
                  },
                  {
                    type: "box", layout: "vertical", flex: 2, paddingLeft: "15px",
                    contents: [
                      { type: "text", text: currentOfficer?.nick_name || lineProfile.displayName, color: "#ffffff", weight: "bold", size: "lg" },
                      { type: "text", text: currentOfficer ? `${currentOfficer.rank}${currentOfficer.name}` : "ยังไม่ได้ลงทะเบียน", color: "#ffffff", size: "xs", opacity: 0.7, wrap: true },
                      { type: "text", text: currentOfficer?.line_status === 'approved' ? "✅ ยืนยันตัวตนสำเร็จ" : "⏳ รออนุมัติ", color: "#ffd700", size: "xs", weight: "bold", margin: "md" }
                    ]
                  }
                ]
              },
              {
                type: "box", layout: "vertical", paddingAll: "15px", backgroundColor: "#00000033",
                contents: [
                  { type: "text", text: `ID: ${senderId}`, color: "#ffffff66", size: "xxs", wrap: true },
                  { type: "button", action: { type: "uri", label: "📍 รายงานตัว (GPS)", uri: "https://manage-i2-snowy.vercel.app/verify" }, style: "primary", color: "#ffffff22", margin: "md", height: "sm" }
                ]
              }
            ]
          }
        };
        await replyFlex(replyToken, "Digital Badge GGS2", badgeFlex, token);
      }
      // คำสั่งอื่นๆ
      else if (text === 'วิธีใช้' || text === 'help') {
        await replyText(replyToken, "📋 คำสั่งที่ใช้ได้:\n1. ลงทะเบียน [ชื่อเล่น]\n2. ใครอยู่เวร\n3. เช็คไอดี\n4. ผมชื่ออะไร", token);
      }
      else if (text === 'เช็คไอดี') {
        await replyText(replyToken, `🆔 ID คุณ: ${senderId}`, token);
      }
      else if (text === 'ใครอยู่เวร') {
        const today = new Date().toISOString().split('T')[0];
        const { data: duty } = await supabase.from('duty_roster').select('officer_name').eq('duty_date', today).maybeSingle();
        await replyText(replyToken, duty ? `👮‍♂️ เวรวันนี้: ${duty.officer_name}` : "📅 ไม่มีข้อมูลเวร", token);
      }
      else if (text.startsWith('ลงทะเบียน')) {
        const nick = text.replace('ลงทะเบียน', '').trim();
        if (currentOfficer) { await replyText(replyToken, "⚠️ คุณลงทะเบียนแล้ว", token); }
        else {
          const { data } = await supabase.from('officers').update({ line_user_id: senderId, line_status: 'pending', line_display_name: lineProfile.displayName }).ilike('nick_name', `%${nick}%`).select();
          await replyText(replyToken, data?.length ? `📝 รับคำขอของ "${nick}" แล้ว รออนุมัติครับ` : `❌ ไม่พบชื่อ "${nick}"`, token);
        }
      }
      else if (event.source.type === 'user' && !currentOfficer) {
        await replyText(replyToken, `สวัสดีครับคุณ ${lineProfile.displayName}! พิมพ์ "ลงทะเบียน [ชื่อเล่น]" เพื่อเริ่มงานครับ`, token);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
