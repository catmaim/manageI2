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

// --- 🛠️ 2. ฟังก์ชันตอบกลับแบบการ์ด (Flex Reply + BlackBox Logging) ---
async function replyFlex(replyToken: string, altText: string, contents: any, token: string | undefined) {
  if (!token) return;
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'flex', altText, contents }] }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    // 🕵️‍♂️ บันทึกความผิดพลาดลง SQL เพื่อให้บอสส่องดูได้
    await supabase.from('system_logs').insert([{ 
      log_type: 'LINE_API_ERROR', 
      message: `Flex Message Rejected: ${errorData.message || 'Unknown Error'}`,
      details: errorData 
    }]);
    // ส่งข้อความแจ้งเตือนบอสทาง LINE ทันที
    await replyText(replyToken, `❌ บอทพยายามส่งการ์ดแต่ LINE ปฏิเสธ: ${errorData.message}`, token);
  }
  return res.ok;
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
        try {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${senderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const p = await profileRes.json();
            lineProfile.displayName = p.displayName || lineProfile.displayName;
            lineProfile.pictureUrl = p.pictureUrl || lineProfile.pictureUrl;
          }
        } catch (e) {}
      }

      // 🔍 ค้นหาเจ้าหน้าที่
      const { data: currentOfficer } = await supabase
        .from('officers')
        .select('id, nick_name, rank, name, line_status')
        .eq('line_user_id', senderId)
        .maybeSingle();

      // --- 🕹️ ระบบคำสั่ง ---
      
      if (text === 'ผมชื่ออะไร') {
        const badgeColor = currentOfficer?.line_status === 'approved' ? "#064e3b" : "#800000";
        const badgeStatus = currentOfficer?.line_status === 'approved' ? "✅ ยืนยันตัวตนสำเร็จ" : "⏳ รออนุมัติ";
        
        const badgeFlex = {
          type: "bubble",
          body: {
            type: "box", layout: "vertical", backgroundColor: badgeColor, paddingAll: "25px",
            contents: [
              {
                type: "box", layout: "horizontal",
                contents: [
                  {
                    type: "box", layout: "vertical", flex: 1,
                    contents: [{ type: "image", url: lineProfile.pictureUrl, size: "full", aspectRatio: "1:1", aspectMode: "cover", cornerRadius: "12px" }]
                  },
                  {
                    type: "box", layout: "vertical", flex: 2, paddingLeft: "15px",
                    contents: [
                      { type: "text", text: currentOfficer?.nick_name || lineProfile.displayName, color: "#ffffff", weight: "bold", size: "lg" },
                      { type: "text", text: currentOfficer ? `${currentOfficer.rank}${currentOfficer.name}` : "ยังไม่ลงทะเบียน", color: "#ffffff", size: "xxs", opacity: 0.7, wrap: true },
                      { type: "text", text: badgeStatus, color: "#ffd700", size: "xs", weight: "bold", margin: "md" }
                    ]
                  }
                ]
              },
              {
                type: "box", layout: "vertical", margin: "xl", paddingAll: "12px", backgroundColor: "#00000033", cornerRadius: "10px",
                contents: [
                  { type: "text", text: `ID: ${senderId}`, color: "#ffffff66", size: "xxs", wrap: true },
                  { type: "button", action: { type: "uri", label: "📍 รายงานตัว (GPS)", uri: "https://manage-i2-snowy.vercel.app/verify" }, style: "primary", color: "#ffffff22", margin: "sm", height: "sm" }
                ]
              }
            ]
          }
        };
        await replyFlex(replyToken, "Digital Badge GGS2", badgeFlex, token);
      }
      else if (text === 'วิธีใช้' || text === 'help') {
        await replyText(replyToken, "📋 คำสั่ง:\n1. ลงทะเบียน [ชื่อเล่น]\n2. ใครอยู่เวร\n3. เช็คไอดี\n4. ผมชื่ออะไร", token);
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

      // --- 📊 บันทึก Log ทุกการเคลื่อนไหว ---
      const logOfficerName = currentOfficer ? currentOfficer.nick_name : lineProfile.displayName;
      await supabase.from('system_logs').insert([{ 
        log_type: 'LINE_MSG', message: `💬 [${logOfficerName}] ${text}`, 
        details: { sender: senderId, line_name: lineProfile.displayName, officer_name: currentOfficer?.nick_name || null } 
      }]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
