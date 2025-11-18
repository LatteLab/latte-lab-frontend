import { SignupForm } from '@/components/auth/signup-form';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Latte Lab</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
