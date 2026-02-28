import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

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
    SELECT id, name, email, phone, gender, birth_year, civil_status, city, county
    FROM users WHERE id = ${user.id}`;

  return NextResponse.json({ user: result.rows[0] });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, phone, gender, birth_year, civil_status, city, county, password } = await request.json();

  try {
    if (password && password.length >= 8) {
      const hash = await bcrypt.hash(password, 10);
      await sql`UPDATE users SET name=${name}, email=${email}, phone=${phone}, gender=${gender},
        birth_year=${birth_year}, civil_status=${civil_status}, city=${city || ''}, county=${county},
        password_hash=${hash} WHERE id=${user.id}`;
    } else {
      await sql`UPDATE users SET name=${name}, email=${email}, phone=${phone}, gender=${gender},
        birth_year=${birth_year}, civil_status=${civil_status}, city=${city || ''}, county=${county}
        WHERE id=${user.id}`;
    }

    const newToken = signToken({
      ...user, name, email, gender, birth_year, civil_status, city: city || '', county,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('token', newToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
    });
    return response;
  } catch (err: any) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'E-post eller telefon redan registrerat.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}
