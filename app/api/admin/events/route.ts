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
    SELECT e.*, 
      (SELECT COUNT(*) FROM event_interest ei WHERE ei.event_id = e.id) as interest_count
    FROM events e ORDER BY e.event_date DESC`;

  return NextResponse.json({ events: result.rows });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, event_date, location } = await request.json();

  if (!title || !event_date) {
    return NextResponse.json({ error: 'Titel och datum krävs.' }, { status: 400 });
  }

  await sql`
    INSERT INTO events (title, description, event_date, location, created_by)
    VALUES (${title}, ${description || ''}, ${event_date}, ${location || ''}, ${admin.id})`;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get('id');
  if (!eventId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await sql`DELETE FROM event_interest WHERE event_id = ${parseInt(eventId)}`;
  await sql`DELETE FROM events WHERE id = ${parseInt(eventId)}`;

  return NextResponse.json({ success: true });
}
