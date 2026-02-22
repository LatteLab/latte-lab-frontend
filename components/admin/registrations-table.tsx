'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { removeRegistration, approveRegistration, denyRegistration } from '@/app/actions/events';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2, Check, X } from 'lucide-react';

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
  selected: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  checked_in: 'bg-green-500/10 text-green-700 border-green-500/20',
  no_show: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  pending_approval: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export function RegistrationsTable({
  registrations,
  eventId,
  showPriority,
  showApprovalActions,
}: {
  registrations: Registration[];
  eventId: string;
  showPriority?: boolean;
  showApprovalActions?: boolean;
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

  const handleApprove = (registrationId: string) => {
    startTransition(async () => {
      try {
        await approveRegistration(registrationId, eventId);
        toast.success('Registration approved');
      } catch {
        toast.error('Failed to approve registration');
      }
    });
  };

  const handleDeny = (registrationId: string) => {
    startTransition(async () => {
      try {
        await denyRegistration(registrationId, eventId);
        toast.success('Registration denied');
      } catch {
        toast.error('Failed to deny registration');
      }
    });
  };

  if (registrations.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No registrations yet.</p>;
  }

  // Sort: pending_approval first, then by createdAt
  const sorted = [...registrations].sort((a, b) => {
    if (a.registration.status === 'pending_approval' && b.registration.status !== 'pending_approval') return -1;
    if (a.registration.status !== 'pending_approval' && b.registration.status === 'pending_approval') return 1;
    return new Date(a.registration.createdAt).getTime() - new Date(b.registration.createdAt).getTime();
  });

  return (
    <div className="space-y-1">
      {sorted.map(({ registration, user }) => (
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
            {showApprovalActions && registration.status === 'pending_approval' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  onClick={() => handleApprove(registration.id)}
                  disabled={isPending}
                  title="Approve"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  onClick={() => handleDeny(registration.id)}
                  disabled={isPending}
                  title="Deny"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemove(registration.id)}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
