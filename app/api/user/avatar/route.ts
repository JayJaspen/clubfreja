import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { put, del } from '@vercel/blob';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Allow fetching another user's avatar
  const userId = request.nextUrl.searchParams.get('userId') || user.id;

  const result = await sql`SELECT avatar_url FROM users WHERE id = ${Number(userId)}`;
  return NextResponse.json({ avatar_url: result.rows[0]?.avatar_url || '' });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Ingen fil vald.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Endast bilder.' }, { status: 400 });

    // Delete old avatar if exists
    const old = await sql`SELECT avatar_url FROM users WHERE id = ${user.id}`;
    if (old.rows[0]?.avatar_url) {
      try { await del(old.rows[0].avatar_url); } catch {}
    }

    // Upload new
    const blob = await put(`avatars/${user.id}-${Date.now()}.${file.type.split('/')[1]}`, file, {
      access: 'public',
    });

    await sql`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${user.id}`;

    return NextResponse.json({ success: true, avatar_url: blob.url });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Uppladdning misslyckades.' }, { status: 500 });
  }
}
