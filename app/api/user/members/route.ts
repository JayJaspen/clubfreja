import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || user.is_admin) return null;
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await sql`
    SELECT id, name, gender, birth_year, civil_status, city, county, avatar_url
    FROM users WHERE is_admin = FALSE AND status = 'approved' AND id != ${user.id}
    ORDER BY name ASC`;

  return NextResponse.json({ members: result.rows });
}
