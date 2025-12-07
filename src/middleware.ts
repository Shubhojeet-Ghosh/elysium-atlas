import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/auth/login",
  "/auth/verify",
  "/", // Root page - adjust if this should be private
];

// Define private routes that require authentication
const privateRoutes = [
  "/my-agents",
  // Add more private routes here as needed
];

// Check if a route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Check if a route is private
function isPrivateRoute(pathname: string): boolean {
  return privateRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = "elysium_atlas_session_token";
  const sessionToken = request.cookies.get(cookieName)?.value;
  const hasValidToken = sessionToken && sessionToken.trim() !== "";

  // Get the origin from the request URL (includes protocol and host)
  const origin = new URL(request.url).origin;

  // Check if user has valid token and is trying to access public routes
  // Exception: Allow authenticated users to access root "/" route
  if (hasValidToken && isPublicRoute(pathname) && pathname !== "/") {
    // Redirect authenticated users away from public pages to my-agents
    const myAgentsUrl = new URL("/my-agents", origin);
    return NextResponse.redirect(myAgentsUrl);
  }

  // Check if the route is private
  if (isPrivateRoute(pathname)) {
    // If no valid session token, redirect to login
    if (!hasValidToken) {
      // Construct the full login URL
      const loginUrl = new URL("/auth/login", origin);

      // Preserve the original URL as a redirect parameter if needed
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access to public routes and routes that are neither public nor private
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (hot module replacement)
     * - favicon.ico, robots.txt, sitemap.xml, etc.
     * - All static file extensions (images, fonts, etc.)
     * - Files in the public folder
     */
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf|json|xml|pdf|zip)$).*)",
  ],
};
