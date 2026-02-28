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

// GET — list own images, or another member's visible images
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const forUserId = request.nextUrl.searchParams.get('userId');

  if (forUserId && Number(forUserId) !== user.id) {
    // Viewing another member's gallery — only show images they have access to
    const targetId = Number(forUserId);

    const images = await sql`
      SELECT ui.id, ui.blob_url, ui.visibility, ui.created_at
      FROM user_images ui
      WHERE ui.user_id = ${targetId}
        AND (
          ui.visibility = 'public'
          OR (ui.visibility = 'selected' AND EXISTS (
            SELECT 1 FROM image_access ia WHERE ia.image_id = ui.id AND ia.allowed_user_id = ${user.id}
          ))
        )
      ORDER BY ui.created_at DESC`;

    return NextResponse.json({ images: images.rows, own: false });
  }

  // Own gallery — show all with access info
  const images = await sql`
    SELECT ui.id, ui.blob_url, ui.visibility, ui.created_at
    FROM user_images ui
    WHERE ui.user_id = ${user.id}
    ORDER BY ui.created_at DESC`;

  // Get access lists for 'selected' images
  const imagesWithAccess = await Promise.all(images.rows.map(async (img: any) => {
    if (img.visibility === 'selected') {
      const access = await sql`
        SELECT ia.allowed_user_id, u.name
        FROM image_access ia
        JOIN users u ON ia.allowed_user_id = u.id
        WHERE ia.image_id = ${img.id}`;
      return { ...img, allowed_users: access.rows };
    }
    return { ...img, allowed_users: [] };
  }));

  return NextResponse.json({ images: imagesWithAccess, own: true });
}

// POST — upload image
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const visibility = (formData.get('visibility') as string) || 'private';

    if (!file) return NextResponse.json({ error: 'Ingen fil vald.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Endast bilder.' }, { status: 400 });

    const blob = await put(`gallery/${user.id}/${Date.now()}.${file.type.split('/')[1]}`, file, {
      access: 'public',
    });

    const result = await sql`
      INSERT INTO user_images (user_id, blob_url, visibility)
      VALUES (${user.id}, ${blob.url}, ${visibility})
      RETURNING id`;

    return NextResponse.json({ success: true, imageId: result.rows[0].id, blob_url: blob.url });
  } catch (err: any) {
    console.error('Gallery upload error:', err);
    return NextResponse.json({ error: 'Uppladdning misslyckades.' }, { status: 500 });
  }
}

// PUT — update visibility and access list
export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { imageId, visibility, allowedUserIds } = await request.json();

  // Verify ownership
  const img = await sql`SELECT id FROM user_images WHERE id = ${imageId} AND user_id = ${user.id}`;
  if (img.rows.length === 0) return NextResponse.json({ error: 'Bilden hittades inte.' }, { status: 404 });

  await sql`UPDATE user_images SET visibility = ${visibility} WHERE id = ${imageId}`;

  // Update access list
  await sql`DELETE FROM image_access WHERE image_id = ${imageId}`;

  if (visibility === 'selected' && allowedUserIds?.length > 0) {
    for (const uid of allowedUserIds) {
      await sql`INSERT INTO image_access (image_id, allowed_user_id) VALUES (${imageId}, ${uid}) ON CONFLICT DO NOTHING`;
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE — delete image
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const imageId = request.nextUrl.searchParams.get('id');
  if (!imageId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const img = await sql`SELECT blob_url FROM user_images WHERE id = ${Number(imageId)} AND user_id = ${user.id}`;
  if (img.rows.length === 0) return NextResponse.json({ error: 'Bilden hittades inte.' }, { status: 404 });

  try { await del(img.rows[0].blob_url); } catch {}
  await sql`DELETE FROM image_access WHERE image_id = ${Number(imageId)}`;
  await sql`DELETE FROM user_images WHERE id = ${Number(imageId)}`;

  return NextResponse.json({ success: true });
}
