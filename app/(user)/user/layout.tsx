import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/user/top-nav';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
