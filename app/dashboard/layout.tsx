import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/');
  const user = verifyToken(token);
  if (!user) redirect('/');
  if (user.is_admin) redirect('/admin');
  if (user.status !== 'approved') redirect('/');
  return <>{children}</>;
}
