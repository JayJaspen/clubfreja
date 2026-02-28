import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { phone, code, userData } = await request.json();

    const result = await sql`
      SELECT id FROM sms_codes
      WHERE phone=${phone} AND code=${code} AND used=FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1`;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ogiltig eller utgången kod.' }, { status: 400 });
    }

    await sql`UPDATE sms_codes SET used=TRUE WHERE id=${result.rows[0].id}`;

    const hash = await bcrypt.hash(userData.password, 10);
    await sql`
      INSERT INTO users (name, email, phone, password_hash, gender, birth_year, civil_status, city, county, status)
      VALUES (${userData.name}, ${userData.email}, ${userData.phone}, ${hash},
              ${userData.gender}, ${userData.birth_year}, ${userData.civil_status},
              ${userData.city || ''}, ${userData.county}, 'pending')`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Verify error:', err);
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'E-post eller mobilnummer redan registrerat.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}
