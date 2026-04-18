import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

      // 1. ลองดึงโปรไฟล์แบบระมัดระวังที่สุด
      let debugInfo = `TEXT: ${text}\nSENDER: ${senderId}\n`;
      let displayName = "Unknown";
      
      try {
        const pRes = await fetch(`https://api.line.me/v2/bot/profile/${senderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) {
          const p = await pRes.json();
          displayName = p.displayName;
          debugInfo += `LINE_NAME: ${displayName}\n`;
        } else {
          debugInfo += `PROFILE_ERR: ${pRes.status}\n`;
        }
      } catch (e) { debugInfo += `PROFILE_CRASH: ${e.message}\n`; }

      // 2. ลองคุยกับ Supabase
      try {
        const { data: officer, error: dbErr } = await supabase
          .from('officers')
          .select('nick_name, rank')
          .eq('line_user_id', senderId)
          .maybeSingle();
        
        if (dbErr) debugInfo += `DB_ERR: ${dbErr.message}\n`;
        else debugInfo += `OFFICER: ${officer ? officer.nick_name : 'Not Found'}\n`;
      } catch (e) { debugInfo += `DB_CRASH: ${e.message}\n`; }

      // 3. บันทึก Log (ถ้าพังตรงนี้ให้ข้ามไป)
      try {
        await supabase.from('system_logs').insert([{ 
          log_type: 'DEBUG_MSG', 
          message: `Debug: ${text}`, 
          details: { sender: senderId, text: text } 
        }]);
      } catch (e) {}

      // 4. ส่งข้อมูล Debug กลับไปให้บอสดูทาง LINE เลย!
      if (text === 'ผมชื่ออะไร') {
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            replyToken,
            messages: [{ type: 'text', text: `🛡️ GGS2 DEBUG REPORT:\n\n${debugInfo}` }]
          }),
        });
      } else {
        // คำสั่งอื่นๆ ให้ทำงานปกติแบบตัวหนังสือธรรมดา
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            replyToken,
            messages: [{ type: 'text', text: `ได้รับคำสั่ง: ${text}\n(โหมดตรวจสอบกำลังทำงาน)` }]
          }),
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CRITICAL_ERR:', error);
    return NextResponse.json({ success: false });
  }
}
