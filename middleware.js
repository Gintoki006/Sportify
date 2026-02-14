import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/profile(.*)',
  '/clubs(.*)',
  '/api/users(.*)',
  '/api/sport-profiles(.*)',
  '/api/stats(.*)',
  '/api/goals(.*)',
  '/api/clubs(.*)',
  '/api/tournaments(.*)',
  '/api/matches(.*)',
]);

// Routes that are always public (no auth required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is protected and user is not signed in, redirect to sign-in
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Next.js middleware matcher — run on all routes except static files
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
