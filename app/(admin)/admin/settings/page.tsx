import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AdminWhitelistManager } from '@/components/admin/whitelist-manager';
import { getAdminWhitelist } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.isAdmin) {
    redirect('/user');
  }

  const whitelist = await getAdminWhitelist();

  return (
    <>
      <PageHeader title="Admin Settings" showSidebarTrigger />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Whitelist</CardTitle>
            <CardDescription>
              Manage which email addresses have admin access. Users with whitelisted emails
              will automatically receive admin privileges when they log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminWhitelistManager initialWhitelist={whitelist} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
