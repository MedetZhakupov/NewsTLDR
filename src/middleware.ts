import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhook",
  "/api/stats",
  "/terms",
  "/privacy",
  "/blog(.*)",
  "/icon",
  "/apple-icon",
  "/opengraph-image",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|api/webhook|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|xml|webmanifest)).*)",
    "/(api(?!/webhook)|trpc)(.*)",
  ],
};
