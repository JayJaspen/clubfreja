import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
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

// GET — list own images, or another user's visible images
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ofUserId = request.nextUrl.searchParams.get('userId');

  if (ofUserId && parseInt(ofUserId) !== user.id) {
    // Viewing another user's images — only show public + selected (if we're allowed)
    const targetId = parseInt(ofUserId);
    const images = await sql`
      SELECT ui.id, ui.blob_url, ui.visibility, ui.created_at
      FROM user_images ui
      WHERE ui.user_id = ${targetId} AND ui.is_avatar = FALSE
        AND (
          ui.visibility = 'public'
          OR (ui.visibility = 'selected' AND EXISTS(
            SELECT 1 FROM image_access ia WHERE ia.image_id = ui.id AND ia.allowed_user_id = ${user.id}
          ))
        )
      ORDER BY ui.created_at DESC`;

    // Also get avatar
    const avatar = await sql`
      SELECT blob_url FROM user_images WHERE user_id = ${targetId} AND is_avatar = TRUE LIMIT 1`;

    return NextResponse.json({
      images: images.rows,
      avatar: avatar.rows[0]?.blob_url || null,
    });
  }

  // Own images
  const images = await sql`
    SELECT ui.id, ui.blob_url, ui.is_avatar, ui.visibility, ui.created_at
    FROM user_images ui
    WHERE ui.user_id = ${user.id}
    ORDER BY ui.is_avatar DESC, ui.created_at DESC`;

  // Get allowed users for 'selected' images
  const selectedImages = images.rows.filter(i => i.visibility === 'selected');
  let accessMap: Record<number, number[]> = {};

  for (const img of selectedImages) {
    const access = await sql`
      SELECT ia.allowed_user_id
      FROM image_access ia
      WHERE ia.image_id = ${img.id}`;
    accessMap[img.id] = access.rows.map((r: any) => r.allowed_user_id);
  }

  const enriched = images.rows.map(img => ({
    ...img,
    allowed_users: accessMap[img.id] || [],
  }));

  return NextResponse.json({ images: enriched });
}

// PATCH — update image visibility
export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { imageId, visibility, allowedUsers } = await request.json();

  // Verify ownership
  const img = await sql`SELECT id FROM user_images WHERE id = ${imageId} AND user_id = ${user.id}`;
  if (img.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`UPDATE user_images SET visibility = ${visibility} WHERE id = ${imageId}`;

  // Update access list
  await sql`DELETE FROM image_access WHERE image_id = ${imageId}`;
  if (visibility === 'selected' && allowedUsers?.length > 0) {
    for (const allowedId of allowedUsers) {
      await sql`INSERT INTO image_access (image_id, allowed_user_id) VALUES (${imageId}, ${allowedId}) ON CONFLICT DO NOTHING`;
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove image
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const imageId = request.nextUrl.searchParams.get('id');
  if (!imageId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const img = await sql`SELECT blob_url FROM user_images WHERE id = ${parseInt(imageId)} AND user_id = ${user.id}`;
  if (img.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await del(img.rows[0].blob_url);
  } catch (e) { /* blob might already be deleted */ }

  await sql`DELETE FROM image_access WHERE image_id = ${parseInt(imageId)}`;
  await sql`DELETE FROM user_images WHERE id = ${parseInt(imageId)}`;

  return NextResponse.json({ success: true });
}
