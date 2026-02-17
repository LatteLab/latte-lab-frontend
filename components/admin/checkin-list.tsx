'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { checkinAttendee, undoCheckin, closeEvent } from '@/app/actions/events';
import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Check, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Attendee {
  registration: {
    id: string;
    status: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export function CheckinList({
  attendees,
  eventId,
  eventName,
}: {
  attendees: Attendee[];
  eventId: string;
  eventName: string;
}) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showClose, setShowClose] = useState(false);

  const checkedInCount = attendees.filter(a => a.registration.status === 'checked_in').length;
  const total = attendees.length;
  const percent = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

  const filtered = useMemo(() => {
    if (!search) return attendees;
    const q = search.toLowerCase();
    return attendees.filter(a =>
      a.user.name?.toLowerCase().includes(q) ||
      a.user.email?.toLowerCase().includes(q)
    );
  }, [attendees, search]);

  const handleToggle = (attendee: Attendee) => {
    startTransition(async () => {
      try {
        if (attendee.registration.status === 'checked_in') {
          const prev = attendee.registration.status === 'checked_in' ? 'registered' : 'selected';
          await undoCheckin(attendee.registration.id, eventId, prev as 'registered' | 'selected');
        } else {
          await checkinAttendee(attendee.registration.id, eventId);
        }
      } catch {
        toast.error('Failed to update check-in');
      }
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      try {
        await closeEvent(eventId);
        toast.success('Event closed. No-shows have been recorded.');
        setShowClose(false);
      } catch {
        toast.error('Failed to close event');
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b p-4 space-y-3">
        <h1 className="text-lg font-semibold truncate">{eventName}</h1>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{checkedInCount} / {total}</span>
          <span className="text-sm text-muted-foreground">checked in</span>
        </div>
        <Progress value={percent} className="h-2" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((attendee) => {
          const isCheckedIn = attendee.registration.status === 'checked_in';
          return (
            <button
              key={attendee.registration.id}
              onClick={() => handleToggle(attendee)}
              disabled={isPending}
              className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors ${
                isCheckedIn ? 'bg-green-500/5 opacity-60' : 'hover:bg-muted/50'
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={attendee.user.image || undefined} />
                <AvatarFallback>
                  {attendee.user.name?.split(' ').map(n => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{attendee.user.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground truncate">{attendee.user.email}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0 ${
                isCheckedIn
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-muted-foreground/30'
              }`}>
                {isCheckedIn && <Check className="h-4 w-4" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Close event button */}
      <div className="shrink-0 border-t p-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setShowClose(true)}
        >
          Close Event
        </Button>
      </div>

      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Event</DialogTitle>
            <DialogDescription>
              This will mark {total - checkedInCount} unchecked attendees as no-shows.
              No-shows affect lottery priority scores. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClose(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClose} disabled={isPending}>
              {isPending ? 'Closing...' : 'Confirm Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
