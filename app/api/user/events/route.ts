import { NextRequest, NextResponse } from 'next/server';
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
    SELECT e.*,
      (SELECT COUNT(*) FROM event_interest ei WHERE ei.event_id = e.id) as interest_count,
      EXISTS(SELECT 1 FROM event_interest ei WHERE ei.event_id = e.id AND ei.user_id = ${user.id}) as has_interest
    FROM events e
    ORDER BY e.event_date ASC`;

  return NextResponse.json({ events: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = await request.json();

  // Toggle interest
  const existing = await sql`
    SELECT id FROM event_interest WHERE event_id = ${eventId} AND user_id = ${user.id}`;

  if (existing.rows.length > 0) {
    await sql`DELETE FROM event_interest WHERE event_id = ${eventId} AND user_id = ${user.id}`;
  } else {
    await sql`INSERT INTO event_interest (event_id, user_id) VALUES (${eventId}, ${user.id})`;
  }

  return NextResponse.json({ success: true });
}
