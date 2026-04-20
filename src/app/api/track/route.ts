import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { uid, ip, isp, city, latitude, longitude, is_gps, device } = await request.json();
    if (!uid) return NextResponse.json({ error: 'missing uid' }, { status: 400 });

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await adminSupabase.from('line_user_intel').upsert({
      line_user_id: uid,
      ip,
      isp,
      city,
      latitude,
      longitude,
      is_gps: !!is_gps,
      device,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'line_user_id', ignoreDuplicates: false });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('track error:', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
