import { MagicLinkForm } from '@/components/auth/magic-link-form';
import { GoogleSignIn } from '@/components/auth/google-sign-in';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function Divider({ text }: { text: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 text-muted-foreground font-medium">{text}</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <span className="text-3xl">☕</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            Latte Lab
          </h1>
          <p className="text-muted-foreground text-lg">Welcome</p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">Sign in or create an account</CardTitle>
            <CardDescription className="text-center">
              Choose your preferred method to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {/* Google Sign In */}
            <GoogleSignIn />

            <Divider text="or" />

            {/* Magic Link */}
            <MagicLinkForm />
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground/70 max-w-sm mx-auto">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-muted-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-muted-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
