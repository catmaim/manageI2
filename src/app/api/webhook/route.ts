import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const THAI_PHONE_RE = /(0[6-9]\d{8})/;

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
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

      // 🕵️ Intel: detect phone + upsert line_user_intel
      const phoneMatch = text.match(THAI_PHONE_RE);
      const detectedPhone = phoneMatch ? phoneMatch[1] : null;
      await adminSupabase.from('line_user_intel').upsert({
        line_user_id: senderId,
        display_name: lineProfile.displayName,
        ...(detectedPhone && { phone: detectedPhone }),
        last_seen: new Date().toISOString(),
      }, { onConflict: 'line_user_id', ignoreDuplicates: false });
      
      // --- 🕹️ COMMANDS LOGIC ---

      // 1. ผมชื่ออะไร (ดึงข้อมูลจริงจาก Supabase)
      if (text === 'ผมชื่ออะไร') {
        // เช็คว่ามีข้อมูลในฐานข้อมูลหรือไม่
        const isRegistered = !!officer; 
        
        // จัดเตรียมข้อมูลที่จะแสดง (ถ้ามีข้อมูลใช้ข้อมูล DB, ถ้าไม่มีให้บอกว่ายังไม่ลงทะเบียน)
        const displayName = isRegistered ? `${officer.rank || ''}${officer.name || ''}` : lineProfile.displayName;
        const subName = isRegistered ? `ชื่อเล่น: ${officer.nick_name || '-'}` : "ยังไม่ได้ลงทะเบียนในระบบ";
        const statusColor = officer?.line_status === 'approved' ? "#064e3b" : "#cc0000"; // เขียวถ้าอนุมัติ, แดงถ้ารอ
        const statusText = officer?.line_status === 'approved' ? "✅ ยืนยันตัวตนสำเร็จ" : (isRegistered ? "⏳ รอแอดมินอนุมัติ" : "❌ กรุณาลงทะเบียน");

        const badgeFlex = {
          type: "bubble",
          hero: {
            type: "image",
            url: lineProfile.pictureUrl, // 🖼️ ดึงรูปจาก LINE
            size: "full",
            aspectRatio: "1:1",
            aspectMode: "cover"
          },
          body: {
            type: "box", 
            layout: "vertical", 
            backgroundColor: "#f2f3f5", // สีเทาอ่อน
            paddingAll: "20px",
            contents: [
              { 
                type: "text", 
                text: displayName, // ดึง ยศ และ ชื่อ จากตาราง officers
                color: "#cc0000", // สีแดงตามแบบ
                weight: "bold", 
                size: "xl", 
                align: "center", 
                wrap: true 
              },
              { 
                type: "text", 
                text: subName, // ดึงชื่อเล่นมาแสดงบรรทัดรอง
                color: "#555555", 
                size: "md", 
                align: "center", 
                wrap: true, 
                margin: "sm" 
              },
              { 
                type: "text", 
                text: statusText, // ดึงสถานะ line_status มาประมวลผล
                color: statusColor, 
                size: "md", 
                weight: "bold",
                align: "center", 
                wrap: true, 
                margin: "lg" 
              }
            ]
          },
          footer: {
            type: "box", 
            layout: "vertical", 
            backgroundColor: "#f2f3f5", 
            paddingAll: "20px", 
            paddingTop: "0px",
            contents: [
              { 
                type: "button", 
                action: { 
                  type: "uri", 
                  label: "📍 รายงานตัว (GPS)", 
                  uri: `https://manage-i2-snowy.vercel.app/verify?uid=${senderId}`
                }, 
                style: "primary", 
                color: "#c48651", // ปุ่มสีน้ำตาลตามแบบ
                height: "md" 
              }
            ]
          }
        };
        await replyFlex(replyToken, "ข้อมูลประจำตัว", badgeFlex, token);
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
      // 4. ใครอยู่เวร (เวอร์ชันอัปเกรด ค้นหาชื่อแม่นยำขึ้น)
      else if (text === 'ใครอยู่เวร') {
        const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
        const todayDate = new Date(today).toISOString().split('T')[0];
        
        // 1. หาว่าใครเข้าเวรวันนี้จากตาราง duty_roster
        const { data: duty } = await supabase
          .from('duty_roster')
          .select('officer_name')
          .eq('duty_date', todayDate)
          .maybeSingle();

        if (!duty) {
          await replyText(replyToken, "📅 ยังไม่มีข้อมูลเวรสำหรับวันนี้ครับ", token);
          continue;
        }

        // 2. ดึงข้อมูลเจ้าหน้าที่ที่ลงทะเบียนแล้วทั้งหมดมาเทียบ (เหมือนใน Cron Job)
        const { data: allOfficers } = await supabase
          .from('officers')
          .select('line_user_id, rank, name, nick_name')
          .eq('line_status', 'approved');

        // ค้นหาคนที่ชื่อจริง หรือชื่อเล่น อยู่ในชื่อตารางเวร
        const dutyOfficer = allOfficers?.find(o => 
          (o.name && duty.officer_name.includes(o.name)) || 
          (o.nick_name && duty.officer_name.includes(o.nick_name))
        );

        // 3. ดึงรูปโปรไฟล์จาก LINE
        // 💡 แก้ไข: เปลี่ยนรูปสำรองเป็นรูป Default Avatar แบบที่ LINE ไม่บล็อกแน่นอน
        let dutyPicUrl = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; 
        
        if (dutyOfficer?.line_user_id) {
          try {
            const pRes = await fetch(`https://api.line.me/v2/bot/profile/${dutyOfficer.line_user_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (pRes.ok) {
              const p = await pRes.json();
              if (p.pictureUrl) dutyPicUrl = p.pictureUrl;
            }
          } catch (e) {
            console.error("ดึงรูปคนเข้าเวรไม่สำเร็จ:", e);
          }
        }

        // 4. เตรียมชื่อที่จะแสดงผล
        const displayDutyName = dutyOfficer 
          ? `${dutyOfficer.rank || ''}${dutyOfficer.name || ''} (${dutyOfficer.nick_name || ''})` 
          : duty.officer_name;

        // 5. สร้าง Flex Message การ์ดแสดงคนเข้าเวร
        const dutyFlex = {
          type: "bubble",
          hero: {
            type: "image",
            url: dutyPicUrl, // 🖼️ จะเป็นรูปผู้ใช้ หรือรูปรักษาความปลอดภัยหากหาไม่เจอ
            size: "full",
            aspectRatio: "1:1",
            aspectMode: "cover"
          },
          body: {
            type: "box", 
            layout: "vertical", 
            backgroundColor: "#f2f3f5", 
            paddingAll: "20px",
            contents: [
              { 
                type: "text", 
                text: "📢 ประกาศเข้าเวรประจำวันนี้", 
                color: "#c48651", 
                weight: "bold", 
                size: "sm", 
                align: "center" 
              },
              { 
                type: "text", 
                text: displayDutyName, 
                color: "#cc0000", 
                weight: "bold", 
                size: "xl", 
                align: "center", 
                wrap: true, 
                margin: "md" 
              },
              { 
                type: "text", 
                text: `วันที่: ${new Date(todayDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, 
                color: "#555555", 
                size: "sm", 
                align: "center", 
                margin: "sm" 
              }
            ]
          }
        };

        await replyFlex(replyToken, `เวรวันนี้: ${displayDutyName}`, dutyFlex, token);
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