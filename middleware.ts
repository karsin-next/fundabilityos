import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)'
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/admin(.*)',          // Admin has its own secret-based auth
  '/api/admin(.*)',      // Admin API protected by CRON_SECRET
  '/api/webhook/(.*)',   // Webhooks are verified by their own signatures
]);

export default clerkMiddleware(async (auth, req) => {
  // Only enforce Clerk auth on protected routes
  if (!isPublicRoute(req) && isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
