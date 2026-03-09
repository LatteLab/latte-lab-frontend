'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '1rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f87171',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          {error.digest ? `Error ${error.digest}` : 'Oops'}
        </span>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.75rem',
            textAlign: 'center',
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: '#a1a1aa',
            maxWidth: '28rem',
            textAlign: 'center',
            margin: '0 0 2rem',
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>

        <button
          onClick={reset}
          style={{
            padding: '0.625rem 2rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#fafafa',
            backgroundColor: 'transparent',
            border: '1px solid #27272a',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
