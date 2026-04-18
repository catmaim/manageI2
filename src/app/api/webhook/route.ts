import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  console.log('🚀 --- WEBHOOK INCOMING --- 🚀');
  
  try {
    const body = await request.json();
    console.log('📦 Received Body:', JSON.stringify(body, null, 2));
    
    const events = body.events || [];
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    // Log token status (showing only last 4 chars for safety)
    if (token) {
      console.log(`🔑 Token detected: ...${token.slice(-4)}`);
    } else {
      console.error('❌ ERROR: LINE_CHANNEL_ACCESS_TOKEN is NOT set in Environment Variables!');
    }

    for (const event of events) {
      const eventSource = event.source;
      const type = eventSource.type;
      const replyToken = event.replyToken;
      
      let targetId = '';
      if (type === 'group') targetId = eventSource.groupId;
      else if (type === 'room') targetId = eventSource.roomId;
      else targetId = eventSource.userId;

      const senderId = eventSource.userId;

      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        console.log(`💬 User said: ${text} | ReplyToken: ${replyToken}`);

        // บังคับให้บอทตอบกลับทันทีเพื่อทดสอบ (Force Reply)
        const debugMsg = `🤖 GGS2 Debug Mode\n\nบอทได้รับข้อความ: "${text}"\nส่งจาก: ${type}\nID: ${targetId}\n\nระบบเชื่อมต่อสมบูรณ์แล้วครับ!`;
        
        const res = await replyLine(replyToken, debugMsg, token);
        console.log('➡️ Reply attempt result:', JSON.stringify(res));

        // เก็บ Log ลง Supabase ตามปกติ
        await supabase.from('system_logs').insert([{ 
          log_type: 'LINE_MSG_DEBUG', 
          message: `Text: ${text}`, 
          details: { id: targetId, type: type, sender: senderId, reply_res: res }
        }]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook Global Error:', error);
    return NextResponse.json({ success: false });
  }
}

async function replyLine(replyToken: string, message: string, token: string | undefined) {
  if (!token) {
    console.error('❌ replyLine: Token missing');
    return { success: false, error: 'Token missing' };
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
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

    const result = await response.json();
    if (!response.ok) {
      console.error('❌ LINE API Error Response:', JSON.stringify(result));
      return { success: false, error: result };
    }

    console.log('✅ LINE API Success Response:', JSON.stringify(result));
    return { success: true, result };
  } catch (error) {
    console.error('❌ Fetch Exception:', error);
    return { success: false, error: error.message };
  }
}
