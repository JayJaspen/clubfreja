import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || !user.is_admin) return null;
  return user;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await sql`
    SELECT id, name, email, phone, gender, birth_year, civil_status, city, county, status, created_at, approved_at
    FROM users WHERE is_admin = FALSE
    ORDER BY created_at DESC`;

  return NextResponse.json({ members: result.rows });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = request.nextUrl.searchParams.get('id');
  if (!userId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const id = parseInt(userId);
  await sql`DELETE FROM event_interest WHERE user_id = ${id}`;
  await sql`DELETE FROM community_members WHERE user_id = ${id}`;
  await sql`DELETE FROM chat_messages WHERE sender_id = ${id} OR receiver_id = ${id}`;
  await sql`DELETE FROM user_images WHERE user_id = ${id}`;
  await sql`DELETE FROM users WHERE id = ${id} AND is_admin = FALSE`;

  return NextResponse.json({ success: true });
}
