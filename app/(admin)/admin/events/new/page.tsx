import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { EventForm } from '@/components/admin/event-form';

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!session.user.isAdmin) redirect('/user');

  return (
    <>
      <PageHeader title="Create Event" showSidebarTrigger />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <EventForm />
        </div>
      </div>
    </>
  );
}
