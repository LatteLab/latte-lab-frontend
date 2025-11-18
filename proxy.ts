import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/user'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Auth routes (redirect if already logged in)
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to user dashboard if accessing auth routes while logged in
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/user';
    return NextResponse.redirect(redirectUrl);
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && user) {
    // Check if user is admin by looking up their email in the whitelist
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: adminCheck } = await supabase
      .from('admin_whitelist')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminCheck) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/user';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
