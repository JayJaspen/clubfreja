import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        birth_year INTEGER NOT NULL,
        civil_status VARCHAR(30) NOT NULL,
        city VARCHAR(100) NOT NULL DEFAULT '',
        county VARCHAR(100) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS sms_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        location VARCHAR(255),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS event_interest (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS community_members (
        id SERIAL PRIMARY KEY,
        community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(community_id, user_id)
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS user_images (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // Create admin account
    const hash = await bcrypt.hash('Admin123!', 10);
    await sql`
      INSERT INTO users (name, email, phone, password_hash, gender, birth_year, civil_status, city, county, is_admin, status)
      VALUES ('Administrator', 'admin@clubfreja.se', '+46000000000', ${hash}, 'other', 1990, 'undisclosed', 'Malmö', 'Skåne', TRUE, 'approved')
      ON CONFLICT (email) DO NOTHING`;

    return NextResponse.json({
      success: true,
      message: 'Alla tabeller skapade! Admin: admin@clubfreja.se / Admin123!'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
