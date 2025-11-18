import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AdminUsersTable } from '@/components/admin/users-table';
import { AdminWhitelistManager } from '@/components/admin/whitelist-manager';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin by looking up their email in the whitelist
  const { data: adminCheck } = await supabase
    .from('admin_whitelist')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!adminCheck) {
    redirect('/app');
  }

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: whitelist } = await supabase
    .from('admin_whitelist')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <Card>
        <CardHeader>
          <CardTitle>Admin Whitelist</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminWhitelistManager initialWhitelist={whitelist || []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUsersTable initialUsers={users || []} />
        </CardContent>
      </Card>
    </div>
  );
}
