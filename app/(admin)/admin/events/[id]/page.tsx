import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getEventById, getEventRegistrations } from '@/lib/db/event-queries';
import { PageHeader } from '@/components/ui/page-header';
import { EventManagementTabs } from '@/components/admin/event-management-tabs';

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!session.user.isAdmin) redirect('/user');

  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const registrations = await getEventRegistrations(id, { withStats: true });

  return (
    <>
      <PageHeader title={event.name} showSidebarTrigger />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <EventManagementTabs event={event} registrations={registrations} />
        </div>
      </div>
    </>
  );
}
