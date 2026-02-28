import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    await sql`DROP TABLE IF EXISTS image_access`;
    await sql`DROP TABLE IF EXISTS user_images`;

    await sql`
      CREATE TABLE user_images (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        blob_url TEXT NOT NULL,
        is_avatar BOOLEAN DEFAULT FALSE,
        visibility VARCHAR(20) DEFAULT 'private',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    await sql`
      CREATE TABLE image_access (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES user_images(id) ON DELETE CASCADE,
        allowed_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(image_id, allowed_user_id)
      )`;

    return NextResponse.json({
      success: true,
      message: 'Bildtabeller skapade! (user_images + image_access)'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
