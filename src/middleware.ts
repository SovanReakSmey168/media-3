import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidSessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  const authenticated = await isValidSessionToken(token);
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicSharePage = request.nextUrl.pathname.startsWith('/share/');

  if (isPublicSharePage) return NextResponse.next();

  if (isLoginPage) {
    if (authenticated) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (!authenticated) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
