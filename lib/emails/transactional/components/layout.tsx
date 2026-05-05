import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * Branded outer shell shared by every transactional email.
 * Tailwind tokens approximate the app's amber/stone palette.
 */
export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-stone-50 m-0 p-0 font-sans">
          <Container className="bg-white max-w-[600px] mx-auto my-10 rounded-2xl overflow-hidden shadow-sm">
            <Section className="bg-gradient-to-br from-amber-600 to-orange-700 px-8 py-6">
              <Text className="m-0 text-white text-lg font-semibold tracking-tight">
                Latte Lab
              </Text>
            </Section>
            <Section className="px-8 py-8">{children}</Section>
            <Hr className="border-stone-200 m-0" />
            <Section className="px-8 py-6">
              <Text className="text-xs text-stone-500 m-0 leading-relaxed">
                Latte Lab - MIT
              </Text>
              <Text className="text-xs text-stone-400 mt-2 mb-0 leading-relaxed">
                Reply directly to this email to reach the exec team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
