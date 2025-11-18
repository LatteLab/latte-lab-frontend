import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { signOut } from '@/app/actions/auth';

export default async function AppPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin by looking up their email in the whitelist
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_whitelist')
    .select('id')
    .eq('email', user.email)
    .single();

  const isAdmin = !!adminCheck;

  // Debug info
  console.log('User email:', user.email);
  console.log('Admin check data:', adminCheck);
  console.log('Admin check error:', adminError);
  console.log('Is admin:', isAdmin);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <form action={signOut}>
          <Button variant="outline" type="submit">Sign Out</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>User ID: {user.id}</p>
          <p>Admin Status: {isAdmin ? 'Yes' : 'No'}</p>

          {/* Debug info */}
          <div className="mt-4 p-4 bg-muted rounded-lg text-sm space-y-1">
            <p className="font-semibold">Debug Info:</p>
            <p>Email from auth: {user.email}</p>
            <p>Admin check result: {adminCheck ? JSON.stringify(adminCheck) : 'null'}</p>
            <p>Admin check error: {adminError ? JSON.stringify(adminError) : 'none'}</p>
          </div>

          {isAdmin && (
            <Link href="/admin">
              <Button className="mt-4">Go to Admin Panel</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
