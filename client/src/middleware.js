import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_at_least_64_characters_long_for_security_testing_purpose';
const secret = new TextEncoder().encode(JWT_ACCESS_SECRET);

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('access_token')?.value;

  let role = null;

  if (token) {
    try {
      // Decode JWT token for routing purposes
      const verified = await jwtVerify(token, secret, {
        clockTolerance: '7d' // allows advisory client routing while access cookie is rotated
      });
      role = verified.payload.role;
    } catch (err) {
      // Invalid token
      role = null;
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // If visiting public route with valid session, redirect to role dashboard
  if (isPublicRoute) {
    if (role) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // Protected route: requires authentication
  if (!role) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role area enforcement (/admin, /staff, /company)
  const segments = pathname.split('/').filter(Boolean);
  const targetArea = segments[0];

  if (['admin', 'staff', 'company'].includes(targetArea) && targetArea !== role) {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)']
};
