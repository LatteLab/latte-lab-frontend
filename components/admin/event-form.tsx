'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createEventAction, updateEventAction } from '@/app/actions/events';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Event } from '@/lib/db/schema';

function toDatetimeLocal(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function EventForm({ event }: { event?: Event }) {
  const [eventType, setEventType] = useState<'waitlist' | 'lottery'>(event?.type || 'waitlist');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    formData.set('type', eventType);

    startTransition(async () => {
      try {
        if (event) {
          await updateEventAction(event.id, formData);
          toast.success('Event updated');
        } else {
          const created = await createEventAction(formData);
          toast.success('Event created');
          router.push(`/admin/events/${created.id}`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save event');
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Cover image */}
          <div>
            <Label>Cover Image URL</Label>
            <Input
              name="coverImage"
              defaultValue={event?.coverImage || ''}
              placeholder="https://..."
              className="mt-1"
            />
          </div>

          {/* Event type */}
          <div className="space-y-3">
            <Label>Event Type</Label>
            <RadioGroup
              value={eventType}
              onValueChange={(v) => setEventType(v as 'waitlist' | 'lottery')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="waitlist" id="waitlist" />
                <Label htmlFor="waitlist" className="font-normal">Waitlist</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lottery" id="lottery" />
                <Label htmlFor="lottery" className="font-normal">Lottery</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Lottery deadline */}
          {eventType === 'lottery' && (
            <div className="space-y-2">
              <Label htmlFor="lotteryDeadline">Lottery Deadline</Label>
              <Input
                id="lotteryDeadline"
                name="lotteryDeadline"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event?.lotteryDeadline)}
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-3">
            <Label>Status</Label>
            <RadioGroup name="status" defaultValue={event?.status || 'draft'}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="draft" />
                <Label htmlFor="draft" className="font-normal">Draft</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="open" />
                <Label htmlFor="open" className="font-normal">Published</Label>
              </div>
            </RadioGroup>
          </div>
        </aside>

        {/* Main form */}
        <div className="space-y-6">
          <div>
            <Input
              name="name"
              defaultValue={event?.name || ''}
              placeholder="Event Name"
              className="border-0 text-3xl font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 p-0 h-auto"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Start Date & Time</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event?.date)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event?.endDate)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={event?.location || ''}
                placeholder="e.g. MIT Media Lab, E14-633"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={event?.capacity || ''}
                placeholder="e.g. 50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={event?.description || ''}
              placeholder="Describe the event..."
              rows={6}
            />
          </div>

          <Button type="submit" size="lg" className="rounded-xl" disabled={isPending}>
            {isPending ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </div>
    </form>
  );
}
