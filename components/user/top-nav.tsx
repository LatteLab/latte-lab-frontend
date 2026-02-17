'use client';

import { Calendar, Compass, Users, Coffee, Search, Bell, Settings, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Events', url: '/user/events', icon: Calendar },
  { title: 'Discover', url: '/user/discover', icon: Compass },
  { title: 'Directory', url: '/user/directory', icon: Users },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <TooltipProvider delayDuration={0}>
      <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 backdrop-blur-md dark:from-amber-950/30 dark:via-stone-950/80 dark:to-amber-950/30">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Left section: Logo + Nav */}
          <div className="flex items-center">
            {/* Logo group */}
            <Link
              href="/user/events"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Coffee className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              <span className="hidden text-sm sm:inline">Latte Lab</span>
            </Link>

            {/* Nav group — visually separated from logo */}
            <nav className="ml-4 flex items-center gap-0.5 border-l border-border/40 pl-4 sm:ml-6 sm:pl-6">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-black/10 text-foreground dark:bg-white/15'
                            : 'text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.title}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {session?.user?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/user/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {session?.user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
