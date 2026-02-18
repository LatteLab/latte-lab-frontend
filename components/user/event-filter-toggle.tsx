'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const tabs = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
] as const;

export function EventFilterToggle({ active }: { active: 'upcoming' | 'past' }) {
  return (
    <div className="relative flex items-center rounded-full bg-muted p-0.5">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={`/user/events?filter=${tab.value}`}
          className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === tab.value
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {active === tab.value && (
            <motion.span
              layoutId="event-filter-pill"
              className="absolute inset-0 rounded-full bg-card shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
}
