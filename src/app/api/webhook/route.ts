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
      const senderId = eventSource.userId;
      
      let targetId = '';
      if (type === 'group') targetId = eventSource.groupId;
      else if (type === 'room') targetId = eventSource.roomId;
      else targetId = senderId;

      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();

        // --- 🕵️‍♂️ ปฏิบัติการดึงหน้ากาก (Fetch LINE Profile) ---
        let lineProfile = { displayName: 'Unknown', pictureUrl: null };
        if (senderId) {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${senderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            lineProfile = await profileRes.json();
          }
        }

        // --- 🔍 ค้นหาข้อมูลเจ้าหน้าที่จากฐานข้อมูลเรา ---
        const { data: currentOfficer } = await supabase
          .from('officers')
          .select('id, nick_name, rank, name, line_status')
          .eq('line_user_id', senderId)
          .maybeSingle();

        // 1. คำสั่งพื้นฐาน
        if (text === 'ช่วยเหลือ' || text === 'วิธีใช้' || text === 'help') {
          await replyLine(replyToken, `📋 คู่มือการใช้งาน GGS2 Bot\n\n1️⃣ ลงทะเบียน:\nพิมพ์ "ลงทะเบียน [ชื่อเล่น]"\n\n2️⃣ เช็คเวรวันนี้:\nพิมพ์ "ใครอยู่เวร"\n\n3️⃣ เช็คไอดี:\nพิมพ์ "เช็คไอดี"\n\n4️⃣ เช็คชื่อตัวเอง:\nพิมพ์ "ผมชื่ออะไร"`, token);
        }
        else if (text === 'เช็คไอดี') {
          await replyLine(replyToken, `🆔 ID ห้องนี้คือ:\n${targetId}\n\n👤 ID ของคุณคือ:\n${senderId}`, token);
        }
        else if (text === 'ผมชื่ออะไร') {
          // --- สร้าง Digital Badge แบบ Flex Message ---
          const badgeColor = currentOfficer?.line_status === 'approved' ? "#064e3b" : "#800000";
          const badgeStatus = currentOfficer?.line_status === 'approved' ? "✅ ยืนยันตัวตนสำเร็จ" : "⏳ รอการตรวจสอบ";

          const flexBadge = {
            type: "bubble",
            size: "giga",
            body: {
              type: "box",
              layout: "vertical",
              backgroundColor: badgeColor,
              paddingAll: "0px",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  paddingAll: "30px",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          flex: 1,
                          contents: [
                            { type: "image", url: lineProfile.pictureUrl || "https://img5.pic.in.th/file/secure-sv1/police-logo.png", size: "full", aspectRatio: "1:1", aspectMode: "cover", cornerRadius: "20px" }
                          ]
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          flex: 2,
                          paddingLeft: "20px",
                          contents: [
                            { type: "text", text: currentOfficer?.nick_name || lineProfile.displayName, weight: "bold", color: "#ffffff", size: "xl" },
                            { type: "text", text: currentOfficer ? `${currentOfficer.rank}${currentOfficer.name}` : "ยังไม่ได้ลงทะเบียน", color: "#ffffff", size: "xs", opacity: 0.7, margin: "xs" },
                            { type: "text", text: badgeStatus, color: "#ffd700", size: "xs", weight: "bold", margin: "md" }
                          ]
                        }
                      ]
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      margin: "xl",
                      spacing: "sm",
                      contents: [
                        { type: "text", text: `ID: ${senderId}`, color: "#ffffff", size: "xxs", opacity: 0.4, fontStyle: "italic" },
                        {
                          type: "button",
                          action: { type: "uri", label: "📍 เช็คอินรายงานตัว (GPS)", uri: "https://manage-i2-snowy.vercel.app/verify" },
                          style: "secondary",
                          height: "sm",
                          color: "#ffffff",
                          margin: "md"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          };

          await replyFlex(replyToken, "บัตรประจำตัวดิจิทัล GGS2", flexBadge, token);
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
        // 2. การลงทะเบียน
        else if (text.startsWith('ลงทะเบียน')) {
          const nickname = text.replace('ลงทะเบียน', '').trim();
          if (!nickname) {
             await replyLine(replyToken, "กรุณาระบุชื่อเล่นด้วยครับ", token);
             continue;
          }

          // ก. เช็คว่า 'คนพิมพ์' เคยลงทะเบียนหรือยัง
          if (currentOfficer) {
            await replyLine(replyToken, `⚠️ คุณลงทะเบียนไว้แล้วในชื่อ "${currentOfficer.nick_name}" ครับ\nไม่สามารถลงทะเบียนซ้ำได้ หากต้องการเปลี่ยนข้อมูล โปรดติดต่อแอดมินครับ`, token);
            continue;
          }

          // ข. เช็คว่า 'ชื่อที่จะลง' มีคนอื่นแย่งไปหรือยัง
          const { data: nameTaken } = await supabase
            .from('officers')
            .select('id, nick_name')
            .ilike('nick_name', `%${nickname}%`)
            .not('line_user_id', 'is', null)
            .maybeSingle();

          if (nameTaken) {
            await replyLine(replyToken, `❌ ชื่อเล่น "${nickname}" ถูกลงทะเบียนโดยผู้ใช้อื่นแล้วครับ\nหากนี่คือชื่อของคุณ โปรดแจ้งแอดมินเพื่อตรวจสอบครับ`, token);
            continue;
          }
          // ค. ถ้าผ่านทุกเงื่อนไข ให้ดำเนินการลงทะเบียน (รออนุมัติ)
          const { data } = await supabase
            .from('officers')
            .update({ 
              line_user_id: senderId, 
              line_status: 'pending',
              line_display_name: lineProfile.displayName // บันทึกชื่อจริงจากแอป LINE
            })
            .ilike('nick_name', `%${nickname}%`)
            .select();

          if (data && data.length > 0) {
            // เก็บ Log พร้อมระบุชื่อ LINE จริงๆ ไว้เป็นหลักฐาน
            await replyLine(replyToken, `📝 รับคำขอของ "${data[0].nick_name}" แล้วครับ\n\n📱 ชื่อ LINE ของคุณ: ${lineProfile.displayName}\n⚠️ สถานะ: [รอแอดมินอนุมัติ]`, token);
            await supabase.from('system_logs').insert([{ 
              log_type: 'AUTH_REQUEST', 
              message: `📢 คำขอใหม่จาก LINE: ${lineProfile.displayName} (ขอเป็น ${data[0].nick_name})`, 
              details: { 
                sender: senderId, 
                officer_id: data[0].id, 
                line_name: lineProfile.displayName
              } 
            }]);
          }

          } else {
            await replyLine(replyToken, `❌ ไม่พบชื่อเล่น "${nickname}" ในระบบครับ`, token);
          }
        }
        // 3. กรณีคุยทั่วไป
        else if (type === 'user') {
          if (!currentOfficer) {
            await replyLine(replyToken, `สวัสดีครับคุณ ${lineProfile.displayName}! 🤖\n\nรบกวนพิมพ์ "ลงทะเบียน [ชื่อเล่น]" เพื่อเริ่มต้นใช้งานนะครับ`, token);
          }
        }

        // --- 📊 บันทึก Log พร้อมข้อมูลโปรไฟล์จริง ---
        const officerDisplayName = currentOfficer ? `${currentOfficer.rank}${currentOfficer.nick_name}` : `LINE:${lineProfile.displayName}`;
        await supabase.from('system_logs').insert([{ 
          log_type: 'LINE_MSG', 
          message: `💬 [${officerDisplayName}] ${text}`, 
          details: { 
            target: targetId, 
            sender: senderId, 
            line_name: lineProfile.displayName,
            line_picture: lineProfile.pictureUrl,
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

async function replyFlex(replyToken: string, altText: string, contents: any, token: string | undefined) {
  if (!token) return { success: false };
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
        replyToken, 
        messages: [{ type: 'flex', altText, contents }] 
      }),
    });
    return { success: response.ok };
  } catch (error) {
    return { success: false };
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
