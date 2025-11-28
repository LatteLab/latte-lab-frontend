import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AdminUsersTable } from '@/components/admin/users-table';
import { AdminWhitelistManager } from '@/components/admin/whitelist-manager';
import { getAllUsers, getAdminWhitelist } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.isAdmin) {
    redirect('/user');
  }

  const users = await getAllUsers();
  const whitelist = await getAdminWhitelist();

  return (
    <>
      <PageHeader title="User Management" showSidebarTrigger />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Whitelist</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminWhitelistManager initialWhitelist={whitelist} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUsersTable initialUsers={users} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
