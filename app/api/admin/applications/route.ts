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
    SELECT id, name, email, phone, gender, birth_year, civil_status, city, county, status, created_at
    FROM users WHERE is_admin = FALSE AND status = 'pending'
    ORDER BY created_at DESC`;

  return NextResponse.json({ applications: result.rows });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, action } = await request.json();

  if (action === 'approve') {
    await sql`UPDATE users SET status = 'approved', approved_at = NOW() WHERE id = ${userId} AND is_admin = FALSE`;
  } else if (action === 'reject') {
    await sql`UPDATE users SET status = 'rejected' WHERE id = ${userId} AND is_admin = FALSE`;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
