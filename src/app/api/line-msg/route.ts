import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { to, message, mentions } = await request.json(); // เพิ่มการรับค่า mentions
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ success: false, message: 'LINE Token missing' }, { status: 500 });
  }

  // LINE Messaging API Endpoint
  const url = 'https://api.line.me/v2/bot/message/push';

  try {
    const messageObject: any = {
      type: 'text',
      text: message,
    };

    // ถ้ามีการส่งข้อมูล Tag มาด้วย ให้ใส่เข้าไปใน message object
    if (mentions && mentions.length > 0) {
      messageObject.mention = { mentions };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: to,
        messages: [messageObject],
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ success: false, error: result }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
