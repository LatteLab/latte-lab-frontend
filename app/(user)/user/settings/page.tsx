import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProfileForm } from '@/components/user/profile-form';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await getUserById(session.user.id);
  if (!user) redirect('/login');

  const showWelcome = !user.major && !user.classYear && !user.interests;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        {showWelcome && (
          <Alert className="mb-6">
            <AlertTitle>Welcome to Latte Lab! ☕</AlertTitle>
            <AlertDescription>
              Fill in your details below so other members can find you in the directory.
            </AlertDescription>
          </Alert>
        )}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your member profile information visible to other members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
