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
import { CloseRegistrationButton } from '@/components/admin/close-registration-button';
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
  const pendingCount = registrations.filter(r => r.registration.status === 'pending_approval').length;

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
          {event.visibility === 'private' && event.inviteCode && (
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
              {event.status === 'open' && (
                <div className="flex items-center gap-2 mb-6">
                  {event.requireApproval && (
                    <LotteryDraw eventId={id} entrantCount={pendingCount} />
                  )}
                  <CloseRegistrationButton eventId={id} />
                </div>
              )}
              <RegistrationsTable
                registrations={registrations}
                eventId={id}
                showApprovalActions={event.requireApproval}
                showPriority={event.requireApproval}
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
