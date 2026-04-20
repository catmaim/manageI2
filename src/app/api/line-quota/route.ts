import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'LINE token missing' }, { status: 500 });

  const headers = { Authorization: `Bearer ${token}` };

  const [quotaRes, usageRes] = await Promise.all([
    fetch('https://api.line.me/v2/bot/message/quota', { headers, cache: 'no-store' }),
    fetch('https://api.line.me/v2/bot/message/quota/consumption', { headers, cache: 'no-store' }),
  ]);

  const quota = await quotaRes.json();
  const usage = await usageRes.json();

  return NextResponse.json({
    limit: quota.value ?? 500,
    used: usage.totalUsage ?? 0,
  });
}
