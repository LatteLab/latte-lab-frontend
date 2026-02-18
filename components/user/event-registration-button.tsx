'use client';

import { Button } from '@/components/ui/button';
import { registerForEvent, cancelRegistration } from '@/app/actions/events';
import { useTransition } from 'react';
import { toast } from 'sonner';
import type { Event, EventRegistration } from '@/lib/db/schema';

interface Props {
  event: Event;
  registration: EventRegistration | null;
  spotsRemaining: number;
}

export function EventRegistrationButton({ event, registration, spotsRemaining }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleRegister = () => {
    startTransition(async () => {
      try {
        await registerForEvent(event.id);
        if (event.requireApproval) {
          toast.success('Access requested! Waiting for admin approval.');
        } else if (event.type === 'lottery') {
          toast.success('Entered lottery!');
        } else if (spotsRemaining > 0) {
          toast.success("You're registered!");
        } else {
          toast.success('Added to waitlist!');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Registration failed');
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelRegistration(event.id);
        toast.success('Registration cancelled');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to cancel');
      }
    });
  };

  // Already has a registration record
  if (registration) {
    const statusLabels: Record<string, string> = {
      registered: "You're In",
      waitlisted: "You're on the Waitlist",
      lottery_entered: "Lottery Entry Submitted",
      selected: "You've Been Selected",
      rejected: 'Not Selected',
      checked_in: 'Checked In',
      no_show: 'Marked as No-Show',
      pending_approval: 'Pending Approval',
    };

    const canCancel = ['registered', 'waitlisted', 'lottery_entered', 'pending_approval'].includes(registration.status);

    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full rounded-xl text-lg"
          variant={
            registration.status === 'rejected' || registration.status === 'no_show'
              ? 'destructive'
              : registration.status === 'pending_approval'
                ? 'secondary'
                : 'default'
          }
          disabled
        >
          {statusLabels[registration.status] || registration.status}
        </Button>
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={handleCancel}
            disabled={isPending}
          >
            {registration.status === 'pending_approval' ? 'Cancel Request' : 'Cancel Registration'}
          </Button>
        )}
      </div>
    );
  }

  // Event closed or completed
  if (event.status === 'closed' || event.status === 'completed') {
    return (
      <Button size="lg" className="w-full rounded-xl text-lg" disabled>
        Event Closed
      </Button>
    );
  }

  // Require approval — show "Request Access" for all types
  if (event.requireApproval) {
    return (
      <Button
        size="lg"
        className="w-full rounded-xl text-lg"
        disabled={isPending}
        onClick={handleRegister}
      >
        {isPending ? 'Requesting...' : 'Request Access'}
      </Button>
    );
  }

  // invite_only without approval — FCFS
  if (event.type === 'invite_only') {
    if (spotsRemaining <= 0) {
      return (
        <Button size="lg" className="w-full rounded-xl text-lg" disabled>
          Event Full
        </Button>
      );
    }
    return (
      <Button
        size="lg"
        className="w-full rounded-xl text-lg"
        disabled={isPending}
        onClick={handleRegister}
      >
        {isPending ? 'Registering...' : 'RSVP'}
      </Button>
    );
  }

  // Lottery type
  if (event.type === 'lottery') {
    const deadlinePassed = event.lotteryDeadline && new Date() > event.lotteryDeadline;
    return (
      <Button
        size="lg"
        className="w-full rounded-xl text-lg"
        disabled={isPending || !!deadlinePassed}
        onClick={handleRegister}
      >
        {deadlinePassed ? 'Lottery Closed' : isPending ? 'Entering...' : 'Enter Lottery'}
      </Button>
    );
  }

  // Waitlist type
  return (
    <Button
      size="lg"
      className="w-full rounded-xl text-lg"
      disabled={isPending}
      onClick={handleRegister}
    >
      {isPending ? 'Registering...' : spotsRemaining > 0 ? 'RSVP' : 'Join Waitlist'}
    </Button>
  );
}
