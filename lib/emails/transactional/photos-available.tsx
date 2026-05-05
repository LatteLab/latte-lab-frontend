import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { PhotosAvailablePayload } from '@/lib/emails/templates';

export const photosAvailableSubject = (p: PhotosAvailablePayload) =>
  `Photos from ${p.event.name} are up`;

export function PhotosAvailable(p: PhotosAvailablePayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={photosAvailableSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        Photos from <strong>{p.event.name}</strong> are now available
        {p.photoCount ? ` (${p.photoCount} photo${p.photoCount === 1 ? '' : 's'})` : ''}.
        Take a look and relive the moment.
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View album</CtaButton>
    </Layout>
  );
}
