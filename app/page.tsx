import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to /user
  if (user) {
    redirect('/user');
  }

  // If not authenticated, redirect to login
  redirect('/login');
}
