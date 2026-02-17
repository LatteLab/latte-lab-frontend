import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/components/user/user-sidebar';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <SidebarProvider>
      <UserSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </SidebarProvider>
  );
}
