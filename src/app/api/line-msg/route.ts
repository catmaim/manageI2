import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { to, message } = await request.json();
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ success: false, message: 'LINE Token missing' }, { status: 500 });
  }

  // LINE Messaging API Endpoint
  const url = 'https://api.line.me/v2/bot/message/push';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: to, // User ID or Group ID
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
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
