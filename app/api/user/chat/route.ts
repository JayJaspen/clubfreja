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

// GET — list conversations or messages with a specific user
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const withUserId = request.nextUrl.searchParams.get('with');

  if (withUserId) {
    // Get messages with specific user
    const partnerId = parseInt(withUserId);
    const messages = await sql`
      SELECT cm.id, cm.sender_id, cm.message, cm.created_at,
        u.name as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE (cm.sender_id = ${user.id} AND cm.receiver_id = ${partnerId})
         OR (cm.sender_id = ${partnerId} AND cm.receiver_id = ${user.id})
      ORDER BY cm.created_at ASC
      LIMIT 200`;

    // Mark as read
    await sql`UPDATE chat_messages SET read = TRUE
      WHERE sender_id = ${partnerId} AND receiver_id = ${user.id} AND read = FALSE`;

    return NextResponse.json({ messages: messages.rows });
  }

  // List all conversations (latest message per partner)
  const conversations = await sql`
    SELECT DISTINCT ON (partner_id)
      partner_id, partner_name, last_message, last_at, unread_count
    FROM (
      SELECT
        CASE WHEN cm.sender_id = ${user.id} THEN cm.receiver_id ELSE cm.sender_id END as partner_id,
        CASE WHEN cm.sender_id = ${user.id} THEN r.name ELSE s.name END as partner_name,
        cm.message as last_message,
        cm.created_at as last_at,
        CASE WHEN cm.sender_id != ${user.id} AND cm.read = FALSE THEN 1 ELSE 0 END as unread_count
      FROM chat_messages cm
      JOIN users s ON cm.sender_id = s.id
      JOIN users r ON cm.receiver_id = r.id
      WHERE cm.sender_id = ${user.id} OR cm.receiver_id = ${user.id}
      ORDER BY cm.created_at DESC
    ) sub
    ORDER BY partner_id, last_at DESC`;

  // Aggregate unread counts
  const unreadCounts = await sql`
    SELECT sender_id, COUNT(*) as count
    FROM chat_messages
    WHERE receiver_id = ${user.id} AND read = FALSE
    GROUP BY sender_id`;

  const unreadMap: Record<number, number> = {};
  unreadCounts.rows.forEach((r: any) => { unreadMap[r.sender_id] = parseInt(r.count); });

  const convos = conversations.rows.map((c: any) => ({
    ...c,
    unread_count: unreadMap[c.partner_id] || 0,
  }));

  return NextResponse.json({ conversations: convos });
}

// POST — send a message
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiverId, message } = await request.json();
  if (!receiverId || !message?.trim()) {
    return NextResponse.json({ error: 'Meddelande krävs.' }, { status: 400 });
  }

  await sql`INSERT INTO chat_messages (sender_id, receiver_id, message)
    VALUES (${user.id}, ${receiverId}, ${message.trim()})`;

  return NextResponse.json({ success: true });
}
