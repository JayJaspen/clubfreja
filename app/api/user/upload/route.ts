import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
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

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const isAvatar = formData.get('isAvatar') === 'true';
  const visibility = (formData.get('visibility') as string) || 'private';
  const allowedUsers = formData.get('allowedUsers') as string; // comma-separated IDs

  if (!file) {
    return NextResponse.json({ error: 'Ingen fil vald.' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Filen är för stor. Max 10MB.' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Ogiltigt filformat. Använd JPG, PNG, WebP eller GIF.' }, { status: 400 });
  }

  try {
    // Upload to Vercel Blob
    const blob = await put(`users/${user.id}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // If avatar, remove old avatar flag
    if (isAvatar) {
      await sql`UPDATE user_images SET is_avatar = FALSE WHERE user_id = ${user.id} AND is_avatar = TRUE`;
    }

    // Save to database
    const result = await sql`
      INSERT INTO user_images (user_id, blob_url, is_avatar, visibility)
      VALUES (${user.id}, ${blob.url}, ${isAvatar}, ${isAvatar ? 'public' : visibility})
      RETURNING id`;

    const imageId = result.rows[0].id;

    // If visibility is 'selected', add allowed users
    if (visibility === 'selected' && allowedUsers) {
      const ids = allowedUsers.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const allowedId of ids) {
        await sql`INSERT INTO image_access (image_id, allowed_user_id) VALUES (${imageId}, ${allowedId}) ON CONFLICT DO NOTHING`;
      }
    }

    return NextResponse.json({ success: true, url: blob.url, imageId });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Uppladdning misslyckades.' }, { status: 500 });
  }
}
