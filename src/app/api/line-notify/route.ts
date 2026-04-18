import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();
  const token = process.env.NEXT_PUBLIC_LINE_NOTIFY_TOKEN;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Token missing' }, { status: 500 });
  }

  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.json();
      return NextResponse.json({ success: false, error: errorData }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
