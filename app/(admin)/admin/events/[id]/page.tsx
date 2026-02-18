import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getEventById, getEventRegistrations } from '@/lib/db/event-queries';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/admin/event-form';
import { RegistrationsTable } from '@/components/admin/registrations-table';
import { LotteryDraw } from '@/components/admin/lottery-draw';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!session.user.isAdmin) redirect('/user');

  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const registrations = await getEventRegistrations(id);
  const entrantCount = registrations.filter(r => r.registration.status === 'lottery_entered').length;

  return (
    <>
      <PageHeader
        title={event.name}
        showSidebarTrigger
        actions={
          <Link href={`/admin/events/${id}/checkin`}>
            <Button variant="outline" size="sm">
              <ClipboardCheck className="h-4 w-4 mr-1" />
              Check-in
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {event.type === 'invite_only' && event.inviteCode && (
            <InviteLinkCard eventId={id} inviteCode={event.inviteCode} />
          )}

          <Tabs defaultValue="registrations">
            <TabsList>
              <TabsTrigger value="registrations">
                Registrations ({registrations.length})
              </TabsTrigger>
              <TabsTrigger value="edit">Edit Event</TabsTrigger>
            </TabsList>

            <TabsContent value="registrations" className="mt-6">
              {event.type === 'lottery' && event.status === 'open' && (
                <div className="mb-6">
                  <LotteryDraw eventId={id} entrantCount={entrantCount} />
                </div>
              )}
              <RegistrationsTable
                registrations={registrations}
                eventId={id}
                showPriority={event.type === 'lottery'}
              />
            </TabsContent>

            <TabsContent value="edit" className="mt-6">
              <EventForm event={event} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
