'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CloseRegistrationButton } from '@/components/admin/close-registration-button';
import { InviteLinkCard } from '@/components/admin/invite-link-card';
import { deleteEventAction } from '@/app/actions/events';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { Event } from '@/lib/db/schema';

export function EventSettings({ event }: { event: Event }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEventAction(event.id);
      } catch {
        toast.error('Failed to delete event');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Registration */}
      {event.status === 'open' && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Registration</h3>
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Close Registration</p>
                <p className="text-xs text-muted-foreground">Prevent new registrations for this event.</p>
              </div>
              <CloseRegistrationButton eventId={event.id} />
            </div>
          </div>
        </div>
      )}

      {/* Private Event - Invite Code */}
      {event.visibility === 'private' && event.inviteCode && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Private Event</h3>
          <InviteLinkCard eventId={event.id} inviteCode={event.inviteCode} />
        </div>
      )}

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
        <div className="rounded-xl border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Event</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this event and all registrations. This cannot be undone.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Event</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{event.name}&quot;? This will permanently
                    remove the event and all associated registrations, access records, and lottery
                    history. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                    {isPending ? 'Deleting...' : 'Delete Event'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
