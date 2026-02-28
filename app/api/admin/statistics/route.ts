import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || !user.is_admin) return null;
  return user;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const all = await sql`SELECT gender, birth_year, county, status FROM users WHERE is_admin = FALSE`;

  const members = all.rows;
  const approved = members.filter(m => m.status === 'approved');
  const pending = members.filter(m => m.status === 'pending');

  // Gender counts
  const genderCounts: Record<string, number> = {};
  members.forEach(m => { genderCounts[m.gender] = (genderCounts[m.gender] || 0) + 1; });

  // County counts
  const countyCounts: Record<string, number> = {};
  members.forEach(m => { countyCounts[m.county] = (countyCounts[m.county] || 0) + 1; });

  // Age ranges
  const currentYear = new Date().getFullYear();
  const ageCounts: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56-65': 0, '66+': 0 };
  members.forEach(m => {
    const age = currentYear - m.birth_year;
    if (age <= 25) ageCounts['18-25']++;
    else if (age <= 35) ageCounts['26-35']++;
    else if (age <= 45) ageCounts['36-45']++;
    else if (age <= 55) ageCounts['46-55']++;
    else if (age <= 65) ageCounts['56-65']++;
    else ageCounts['66+']++;
  });

  return NextResponse.json({
    total: members.length,
    approved: approved.length,
    pending: pending.length,
    genderCounts,
    countyCounts,
    ageCounts,
  });
}
