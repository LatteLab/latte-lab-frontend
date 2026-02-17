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
        toast.success(
          event.type === 'lottery' ? 'Entered lottery!' :
          spotsRemaining > 0 ? "You're registered!" : 'Added to waitlist!'
        );
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

  // Already registered
  if (registration) {
    const statusLabels: Record<string, string> = {
      registered: "You're In",
      waitlisted: "You're on the Waitlist",
      lottery_entered: "Lottery Entry Submitted",
      selected: "You've Been Selected",
      rejected: 'Not Selected',
      checked_in: 'Checked In',
      no_show: 'Marked as No-Show',
    };

    const canCancel = ['registered', 'waitlisted', 'lottery_entered'].includes(registration.status);

    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full rounded-xl text-lg"
          variant={registration.status === 'rejected' || registration.status === 'no_show' ? 'destructive' : 'default'}
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
            Cancel Registration
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
