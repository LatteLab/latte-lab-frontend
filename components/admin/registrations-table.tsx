'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { removeRegistration } from '@/app/actions/events';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface Registration {
  registration: {
    id: string;
    status: string;
    lotteryPriorityScore: number | null;
    createdAt: Date;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

const statusColors: Record<string, string> = {
  registered: 'bg-green-500/10 text-green-500 border-green-500/20',
  waitlisted: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  lottery_entered: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  selected: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  checked_in: 'bg-green-500/10 text-green-700 border-green-500/20',
  no_show: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function RegistrationsTable({
  registrations,
  eventId,
  showPriority,
}: {
  registrations: Registration[];
  eventId: string;
  showPriority?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = (registrationId: string) => {
    startTransition(async () => {
      try {
        await removeRegistration(registrationId, eventId);
        toast.success('Registration removed');
      } catch {
        toast.error('Failed to remove registration');
      }
    });
  };

  if (registrations.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No registrations yet.</p>;
  }

  return (
    <div className="space-y-1">
      {registrations.map(({ registration, user }) => (
        <div key={registration.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.split(' ').map(n => n[0]).join('') || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {showPriority && registration.lotteryPriorityScore != null && (
              <span className="text-xs text-muted-foreground">
                Score: {registration.lotteryPriorityScore.toFixed(1)}
              </span>
            )}
            <Badge variant="outline" className={statusColors[registration.status] || ''}>
              {registration.status.replace('_', ' ')}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleRemove(registration.id)}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
