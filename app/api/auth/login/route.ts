import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const result = await sql`
      SELECT id, name, email, password_hash, gender, birth_year, civil_status, city, county, is_admin, status
      FROM users WHERE email=${email}`;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ogiltiga inloggningsuppgifter.' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Ogiltiga inloggningsuppgifter.' }, { status: 401 });
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'Ditt konto väntar fortfarande på godkännande.' }, { status: 403 });
    }
    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Din ansökan har nekats.' }, { status: 403 });
    }

    const token = signToken({
      id: user.id, email: user.email, name: user.name,
      is_admin: user.is_admin, gender: user.gender,
      birth_year: user.birth_year, county: user.county,
      civil_status: user.civil_status, city: user.city,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      redirect: user.is_admin ? '/admin' : '/dashboard',
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}
