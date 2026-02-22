'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventOverview } from '@/components/admin/event-overview';
import { GuestList } from '@/components/admin/guest-list';
import { EventSettings } from '@/components/admin/event-settings';
import type { Event } from '@/lib/db/schema';
import type { Registration } from '@/lib/types/event';

export function EventManagementTabs({
  event,
  registrations,
}: {
  event: Event;
  registrations: Registration[];
}) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="guests">
          Guests ({registrations.length})
        </TabsTrigger>
        <TabsTrigger value="more">More</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <EventOverview
          event={event}
          registrations={registrations}
          onSwitchToGuests={() => setActiveTab('guests')}
        />
      </TabsContent>

      <TabsContent value="guests" className="mt-6">
        <GuestList event={event} registrations={registrations} />
      </TabsContent>

      <TabsContent value="more" className="mt-6">
        <EventSettings event={event} />
      </TabsContent>
    </Tabs>
  );
}
