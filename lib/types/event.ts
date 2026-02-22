export interface Registration {
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

export const statusColors: Record<string, string> = {
  registered: 'bg-green-500/10 text-green-500 border-green-500/20',
  waitlisted: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  selected: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  checked_in: 'bg-green-500/10 text-green-700 border-green-500/20',
  no_show: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  pending_approval: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};
