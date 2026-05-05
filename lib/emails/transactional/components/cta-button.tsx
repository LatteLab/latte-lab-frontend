import { Button, Section } from '@react-email/components';
import * as React from 'react';

export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section className="text-center my-6">
      <Button
        href={href}
        className="bg-stone-900 text-white text-sm font-medium px-6 py-3 rounded-lg no-underline"
      >
        {children}
      </Button>
    </Section>
  );
}
