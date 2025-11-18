import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AdminUsersTable } from '@/components/admin/users-table';
import { AdminWhitelistManager } from '@/components/admin/whitelist-manager';
import { isAdmin, getAllUsers, getAdminWhitelist } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin by looking up their email in the whitelist
  const adminStatus = await isAdmin(user.email!);

  if (!adminStatus) {
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
