import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllMembers } from '@/lib/db/event-queries';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default async function DirectoryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const members = await getAllMembers();

  return (
    <>
      <PageHeader title="Member Directory" showSidebarTrigger />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <Link key={member.id} href={`/user/directory/${member.id}`}>
                <div className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>
                      {member.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{member.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {[member.classYear && `Class of ${member.classYear}`, member.major]
                        .filter(Boolean).join(' · ') || member.email}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {members.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No members yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
