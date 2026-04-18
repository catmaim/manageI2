import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('⏰ --- CRON START: Duty Reminder ---');

  // 1. ตรวจสอบความปลอดภัย
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === 'true';
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    console.error('❌ Unauthorized Attempt');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. ดึงวันที่วันนี้ (เวลาไทย) 
    const now = new Date();
    // 💡 ปรับมาใช้ en-CA แทน fr-CA เพื่อให้ได้รูปแบบ YYYY-MM-DD ที่เป็นมาตรฐานสากล
    const dateString = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    
    console.log(`📅 Target Date (Bangkok): ${dateString}`);

    // 3. ดึงข้อมูลเวรจาก Supabase
    const { data: duty, error: dbError } = await supabase
      .from('duty_roster')
      .select('*')
      .eq('duty_date', dateString)
      .maybeSingle();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 🚨 แก้ไขจุดที่ 1: ดักจับกรณีไม่มีคนเข้าเวรวันนี้ เพื่อไม่ให้ระบบ Crash
    if (!duty) {
      console.log('✅ วันนี้ไม่มีเวรปฏิบัติการ ยกเลิกการแจ้งเตือน');
      return NextResponse.json({ success: true, message: 'No duty today' });
    }

    console.log(`Searching for officer: ${duty.officer_name}`);
    
    // ค้นหาคนที่มีรายชื่อตรงกันเพื่อเอา LINE ID ไป Tag
    const { data: allOfficers } = await supabase
      .from('officers')
      .select('line_user_id, nick_name, name, line_display_name')
      .eq('line_status', 'approved');

    const officer: any = allOfficers?.find(o => 
      (o.name && duty.officer_name.includes(o.name)) || 
      (o.nick_name && duty.officer_name.includes(o.nick_name))
    );

    const targetId = process.env.LINE_GROUP_ID;
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!targetId || !token) throw new Error('LINE Configuration missing');

    const messages = [];

    // --- ข้อความที่ 1: สำหรับ Tag (Mention) ให้มือถือสั่น ---
    if (officer?.line_user_id) {
      const tagText = `@${officer.line_display_name || officer.nick_name || 'เจ้าหน้าที่'}`;
      messages.push({
        type: 'text',
        text: `${tagText} ท่านมีภารกิจเข้าเวรวันนี้ครับ!`,
        mention: {
          mentions: [{
            index: 0,
            length: tagText.length,
            userId: officer.line_user_id
          }]
        }
      });
    }

    // 🚨 แก้ไขจุดที่ 2: ดึงรูปโปรไฟล์จาก LINE API โดยตรง (รูปจะไม่หมดอายุ)
    let profileImg = "https://img5.pic.in.th/file/secure-sv1/police-logo.png";
    if (officer?.line_user_id) {
      try {
        const pRes = await fetch(`https://api.line.me/v2/bot/profile/${officer.line_user_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) {
          const p = await pRes.json();
          if (p.pictureUrl) profileImg = p.pictureUrl; // ได้รูปจริงล่าสุดเสมอ
        }
      } catch (e) {
        console.error("ดึงรูปโปรไฟล์ไม่สำเร็จ:", e);
      }
    }

    // --- ข้อความที่ 2: Flex Message การ์ดเวรสุดหรู ---
    const dutyDateTh = new Date(duty.duty_date).toLocaleDateString('th-TH', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    messages.push({
      type: 'flex',
      altText: `ประกาศเวรปฏิบัติการ: ${duty.officer_name}`,
      contents: {
        type: "bubble",
        size: "giga",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#800000",
          contents: [
            { type: "text", text: "GGS2 MISSION ALERT", color: "#ffd700", size: "xs", weight: "bold", tracking: "0.2em" },
            { type: "text", text: "ประกาศเวรปฏิบัติหน้าที่", color: "#ffffff", size: "lg", weight: "bold", margin: "xs" }
          ]
        },
        hero: {
          type: "image",
          url: profileImg, // 🖼️ ใช้ตัวแปรที่เราดึงสดๆ มาใส่ตรงนี้
          size: "full",
          aspectRatio: "1:1",
          aspectMode: "cover",
          action: { type: "uri", uri: `https://manage-i2-snowy.vercel.app/verify` }
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: duty.officer_name, weight: "bold", size: "xl", color: "#1e293b" },
            { type: "text", text: duty.position || "ปฏิบัติหน้าที่เวรประจำวัน", size: "xs", color: "#64748b", margin: "xs" },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    { type: "text", text: "🗓️ วันที่", color: "#94a3b8", size: "xs", flex: 2 },
                    { type: "text", text: dutyDateTh, color: "#475569", size: "xs", flex: 5, weight: "bold" }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    { type: "text", text: "📞 ติดต่อ", color: "#94a3b8", size: "xs", flex: 2 },
                    { type: "text", text: duty.phone || "-", color: "#475569", size: "xs", flex: 5, weight: "bold" }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "✅ รับทราบงาน (ยืนยันพิกัด)",
                uri: "https://manage-i2-snowy.vercel.app/verify"
              },
              style: "primary",
              color: "#800000"
            },
            { type: "text", text: "โปรดรายงานตัวภายใน 15 นาที", color: "#94a3b8", size: "xxs", align: "center", margin: "md" }
          ]
        },
        styles: {
          footer: { separator: true }
        }
      }
    });

    // 5. ส่งข้อความเข้า LINE (เฉพาะในกลุ่ม)
    console.log('Sending Premium Flex Message to LINE Group...');
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ to: targetId, messages }), // targetId คือ LINE_GROUP_ID
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