'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MapPin, FileText, Users, Ticket, Clock, ToggleLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEventAction, updateEventAction } from '@/app/actions/events';
import { CoverImagePicker } from '@/components/admin/cover-image-picker';
import { TiptapEditor } from '@/components/admin/tiptap-editor';
import { DateTimePicker, TimezonePicker } from '@/components/admin/date-time-picker';
import type { Event } from '@/lib/db/schema';

export function EventForm({ event }: { event?: Event }) {
  const [coverImage, setCoverImage] = useState<string>(event?.coverImage || '');
  const [name, setName] = useState(event?.name || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    event?.date ? new Date(event.date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.endDate ? new Date(event.endDate) : undefined
  );
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventType, setEventType] = useState<'waitlist' | 'lottery'>(
    event?.type || 'waitlist'
  );
  const [capacity, setCapacity] = useState<string>(
    event?.capacity ? String(event.capacity) : ''
  );
  const [lotteryDeadline, setLotteryDeadline] = useState<Date | undefined>(
    event?.lotteryDeadline ? new Date(event.lotteryDeadline) : undefined
  );
  const [status, setStatus] = useState<'draft' | 'open'>(
    event?.status === 'open' ? 'open' : 'draft'
  );
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set('name', name);
    formData.set('coverImage', coverImage);
    formData.set('description', description);
    formData.set('location', location);
    formData.set('capacity', capacity);
    formData.set('type', eventType);
    formData.set('status', status);

    if (startDate) formData.set('date', startDate.toISOString());
    if (endDate) formData.set('endDate', endDate.toISOString());
    if (eventType === 'lottery' && lotteryDeadline) {
      formData.set('lotteryDeadline', lotteryDeadline.toISOString());
    }

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
        toast.error(
          error instanceof Error ? error.message : 'Failed to save event'
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 md:gap-8 md:grid-cols-[minmax(280px,420px)_1fr]">
        {/* Left: Cover Image */}
        <CoverImagePicker value={coverImage || null} onChange={setCoverImage} />

        {/* Right: Form Fields */}
        <div className="space-y-4">
          {/* Event Name */}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event Name"
            className="border-0 text-4xl md:text-5xl font-bold placeholder:text-muted-foreground/30 focus-visible:ring-0 p-0 h-auto tracking-tight leading-tight"
            required
          />

          {/* Date/Time Section */}
          <div className="rounded-xl border bg-muted/30 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 space-y-2">
                <DateTimePicker
                  label="Start"
                  value={startDate}
                  onChange={setStartDate}
                />
                <DateTimePicker
                  label="End"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <div className="self-center sm:self-auto">
                <TimezonePicker value={timezone} onChange={setTimezone} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add Event Location"
              className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Description</span>
            </div>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Add Description"
            />
          </div>

          {/* Event Options */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Event Options
            </h3>
            <div className="rounded-xl border divide-y">
              {/* Event Type */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Event Type</span>
                </div>
                <Select value={eventType} onValueChange={(v) => setEventType(v as 'waitlist' | 'lottery')}>
                  <SelectTrigger className="w-[120px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="lottery">Lottery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Capacity</span>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-[120px] h-8 text-sm text-right"
                  required
                />
              </div>

              {/* Lottery Deadline (conditional) */}
              {eventType === 'lottery' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2.5 gap-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Lottery Deadline</span>
                  </div>
                  <DateTimePicker
                    label=""
                    value={lotteryDeadline}
                    onChange={setLotteryDeadline}
                  />
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Status</span>
                </div>
                <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'open')}>
                  <SelectTrigger className="w-[120px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={isPending}
          >
            {isPending
              ? 'Saving...'
              : event
                ? 'Update Event'
                : 'Create Event'}
          </Button>
        </div>
      </div>
    </form>
  );
}
