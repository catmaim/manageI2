import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// --- 🛠️ HELPER FUNCTIONS ---
async function replyFlex(replyToken: string, altText: string, contents: any, token: string | undefined) {
  if (!token) return { success: false, error: 'Token missing' };
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: 'flex', altText, contents }] }),
    });
    const result = await res.json();
    if (!res.ok) console.error('❌ LINE API FLEX ERROR:', result);
    return { success: res.ok, status: res.status, result };
  } catch (error) { return { success: false, error }; }
}

async function replyLine(replyToken: string, message: string, token: string | undefined) {
  if (!token) return { success: false };
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: message }] }),
    });
    return { success: res.ok };
  } catch (error) { return { success: false }; }
}

// --- 🚀 MAIN WEBHOOK HANDLER ---
export async function POST(request: Request) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      const eventSource = event.source || {};
      const type = eventSource.type; 
      const replyToken = event.replyToken;
      const senderId = eventSource.userId;
      
      let targetId = '';
      if (type === 'group') targetId = eventSource.groupId;
      else if (type === 'room') targetId = eventSource.roomId;
      else targetId = senderId;

      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();

        // 🕵️‍♂️ ดึงโปรไฟล์ LINE จริง
        let lineProfile = { displayName: 'Unknown', pictureUrl: 'https://img5.pic.in.th/file/secure-sv1/police-logo.png' };
        if (senderId) {
          try {
            const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${senderId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
              const p = await profileRes.json();
              if (p.displayName) lineProfile.displayName = p.displayName;
              if (p.pictureUrl) lineProfile.pictureUrl = p.pictureUrl;
            }
          } catch (e) { console.error('Profile fetch failed'); }
        }

        // 🔍 ค้นหาเจ้าหน้าที่
        const { data: currentOfficer } = await supabase
          .from('officers')
          .select('id, nick_name, rank, name, line_status')
          .eq('line_user_id', senderId)
          .maybeSingle();

        // --- 📊 บันทึก Log เบื้องต้น (เพื่อป้องกันการเงียบหาย) ---
        const logOfficerName = currentOfficer ? currentOfficer.nick_name : lineProfile.displayName;
        await supabase.from('system_logs').insert([{ 
          log_type: 'LINE_MSG', message: `💬 [${logOfficerName}] ${text}`, 
          details: { target: targetId, sender: senderId, line_name: lineProfile.displayName, officer_name: currentOfficer?.nick_name || null } 
        }]);

        // --- 🎮 ระบบคำสั่ง (Commands) ---
        
        // 1. ผมชื่ออะไร (PREMIUM FLEX CARD)
        if (text === 'ผมชื่ออะไร' || text === 'who am i') {
          const badgeColor = currentOfficer?.line_status === 'approved' ? "#064e3b" : "#800000";
          const badgeStatus = currentOfficer?.line_status === 'approved' ? "✅ ยืนยันตัวตนสำเร็จ" : "⏳ รอการตรวจสอบ";

          const flexBadge = {
            type: "bubble",
            body: {
              type: "box", layout: "vertical", backgroundColor: badgeColor, paddingAll: "0px",
              contents: [{
                type: "box", layout: "vertical", paddingAll: "20px",
                contents: [
                  {
                    type: "box", layout: "horizontal",
                    contents: [
                      {
                        type: "box", layout: "vertical", flex: 1,
                        contents: [{ type: "image", url: lineProfile.pictureUrl, size: "full", aspectRatio: "1:1", aspectMode: "cover", cornerRadius: "xl" }]
                      },
                      {
                        type: "box", layout: "vertical", flex: 2, paddingLeft: "15px",
                        contents: [
                          { type: "text", text: currentOfficer?.nick_name || lineProfile.displayName, weight: "bold", color: "#ffffff", size: "lg" },
                          { type: "text", text: currentOfficer ? `${currentOfficer.rank}${currentOfficer.name}` : "ยังไม่ได้ลงทะเบียน", color: "#ffffff", size: "xxs", opacity: 0.7, margin: "xs", wrap: true },
                          { type: "text", text: badgeStatus, color: "#ffd700", size: "xs", weight: "bold", margin: "sm" }
                        ]
                      }
                    ]
                  },
                  {
                    type: "box", layout: "vertical", margin: "lg", spacing: "xs",
                    contents: [
                      { type: "text", text: `ID: ${senderId}`, color: "#ffffff", size: "xxs", opacity: 0.3, fontStyle: "italic", wrap: true },
                      {
                        type: "button",
                        action: { type: "uri", label: "📍 รายงานตัว (GPS)", uri: "https://manage-i2-snowy.vercel.app/verify" },
                        style: "secondary", height: "sm", color: "#ffffff", margin: "md"
                      }
                    ]
                  }
                ]
              }]
            }
          };
          await replyFlex(replyToken, "Digital Badge GGS2", flexBadge, token);
          continue;
        }

        // 2. คำสั่งอื่นๆ
        if (text === 'ช่วยเหลือ' || text === 'วิธีใช้' || text === 'help') {
          await replyLine(replyToken, `📋 คู่มือการใช้งาน GGS2 Bot\n\n1️⃣ ลงทะเบียน:\nพิมพ์ "ลงทะเบียน [ชื่อเล่น]"\n\n2️⃣ เช็คเวรวันนี้:\nพิมพ์ "ใครอยู่เวร"\n\n3️⃣ เช็คไอดี:\nพิมพ์ "เช็คไอดี"\n\n4️⃣ เช็คชื่อตัวเอง:\nพิมพ์ "ผมชื่ออะไร"`, token);
        }
        else if (text === 'เช็คไอดี') {
          await replyLine(replyToken, `🆔 ID ห้อง: ${targetId}\n👤 ID คุณ: ${senderId}`, token);
        }
        else if (text === 'ใครอยู่เวร' || text === 'เวรวันนี้') {
          const today = new Date().toISOString().split('T')[0];
          const { data: duty } = await supabase.from('duty_roster').select('*').eq('duty_date', today).maybeSingle();
          if (duty) await replyLine(replyToken, `👮‍♂️ เจ้าหน้าที่เวรวันนี้:\n${duty.officer_name}\n📞 ติดต่อ: ${duty.phone}`, token);
          else await replyLine(replyToken, `📅 ยังไม่มีข้อมูลเวรครับ`, token);
        }
        else if (text.startsWith('ลงทะเบียน')) {
          const nickname = text.replace('ลงทะเบียน', '').trim();
          if (!nickname) { await replyLine(replyToken, "กรุณาระบุชื่อเล่นครับ", token); continue; }
          if (currentOfficer) { await replyLine(replyToken, `⚠️ คุณลงทะเบียนไว้แล้วในชื่อ "${currentOfficer.nick_name}"`, token); continue; }
          const { data } = await supabase.from('officers').update({ line_user_id: senderId, line_status: 'pending', line_display_name: lineProfile.displayName }).ilike('nick_name', `%${nickname}%`).select();
          if (data && data.length > 0) {
            await replyLine(replyToken, `📝 รับคำขอของ "${data[0].nick_name}" แล้ว\n📱 LINE: ${lineProfile.displayName}\n⚠️ สถานะ: [รออนุมัติ]`, token);
            await supabase.from('system_logs').insert([{ log_type: 'AUTH_REQUEST', message: `📢 คำขอใหม่: ${lineProfile.displayName}`, details: { sender: senderId, officer_id: data[0].id } }]);
          } else await replyLine(replyToken, `❌ ไม่พบชื่อเล่น "${nickname}" ในระบบ`, token);
        }
        else if (type === 'user' && !currentOfficer) {
          await replyLine(replyToken, `สวัสดีครับคุณ ${lineProfile.displayName}! 🤖\nรบกวนพิมพ์ "ลงทะเบียน [ชื่อเล่น]" เพื่อเริ่มต้นครับ`, token);
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Global Error:', error);
    return NextResponse.json({ success: false });
  }
}
