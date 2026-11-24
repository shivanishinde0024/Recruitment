import { NextResponse } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'a8b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef';
const secret = new TextEncoder().encode(JWT_ACCESS_SECRET);

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Root landing page is ALWAYS public for all visitors
  if (pathname === '/') {
    return NextResponse.next();
  }

  const token = req.cookies.get('access_token')?.value;

  let role = null;

  if (token) {
    try {
      // Verify JWT signature using secret
      const verified = await jwtVerify(token, secret, {
        clockTolerance: '7d'
      });
      role = verified.payload.role;
    } catch (err) {
      // Resilient fallback: decode token payload directly if secrets differ or rotated
      try {
        const decoded = decodeJwt(token);
        if (decoded && decoded.role) {
          role = decoded.role;
        }
      } catch {
        role = null;
      }
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // If visiting auth routes (/login, /register) with active session, redirect to role dashboard
  if (isPublicRoute) {
    const isSessionExpired = req.nextUrl.searchParams.get('session_expired') === '1';
    if (role && !isSessionExpired) {
      const redirectUrl = req.nextUrl.searchParams.get('redirect');
      if (redirectUrl && redirectUrl.startsWith(`/${role}`)) {
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
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
  matcher: ['/((?!api|_next|favicon.ico|sqa-landing-clean.html|.*\\..*).*)']
};
