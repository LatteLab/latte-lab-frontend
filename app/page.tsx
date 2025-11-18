import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to /app
  if (user) {
    redirect('/app');
  }

  // If not authenticated, redirect to login
  redirect('/login');
}
