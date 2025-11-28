import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default async function AppPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const isAdmin = session.user.isAdmin;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <SignOutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {session.user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>User ID: {session.user.id}</p>
          <p>Admin Status: {isAdmin ? 'Yes' : 'No'}</p>

          {isAdmin && (
            <Link href="/admin">
              <button className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Go to Admin Panel
              </button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
