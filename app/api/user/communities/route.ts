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
    SELECT c.*,
      (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) as member_count,
      EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = ${user.id}) as is_member
    FROM communities c
    ORDER BY c.created_at DESC`;

  return NextResponse.json({ communities: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, communityId, title, description, isPrivate } = await request.json();

  if (action === 'create') {
    if (!title?.trim()) return NextResponse.json({ error: 'Titel krävs.' }, { status: 400 });

    const result = await sql`
      INSERT INTO communities (title, description, is_private, created_by)
      VALUES (${title.trim()}, ${description || ''}, ${isPrivate || false}, ${user.id})
      RETURNING id`;

    // Auto-join creator
    await sql`INSERT INTO community_members (community_id, user_id) VALUES (${result.rows[0].id}, ${user.id})`;

    return NextResponse.json({ success: true });
  }

  if (action === 'join') {
    await sql`INSERT INTO community_members (community_id, user_id)
      VALUES (${communityId}, ${user.id}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ success: true });
  }

  if (action === 'leave') {
    await sql`DELETE FROM community_members WHERE community_id = ${communityId} AND user_id = ${user.id}`;
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
