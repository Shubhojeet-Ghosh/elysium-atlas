import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/auth/login",
  "/auth/verify",
  "/",
  "/chat-with-agent",
  "/team/invite/respond",
];

const privateRoutes = ["/my-agents", "/team"];

// Logged-in users may still visit these public routes (no redirect to /my-agents)
const authenticatedPublicExceptions = [
  "/",
  "/chat-with-agent",
  "/team/invite/respond",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isAuthenticatedPublicException(pathname: string): boolean {
  return authenticatedPublicExceptions.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isPrivateRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;

  return privateRoutes.some((route) => {
    if (route === "/team") return pathname === "/team";
    return pathname === route || pathname.startsWith(route + "/");
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = "elysium_atlas_session_token";
  const sessionToken = request.cookies.get(cookieName)?.value;
  const hasValidToken = sessionToken && sessionToken.trim() !== "";

  const origin = new URL(request.url).origin;

  if (
    hasValidToken &&
    isPublicRoute(pathname) &&
    !isAuthenticatedPublicException(pathname)
  ) {
    const myAgentsUrl = new URL("/my-agents", origin);
    return NextResponse.redirect(myAgentsUrl);
  }

  if (isPrivateRoute(pathname)) {
    if (!hasValidToken) {
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf|json|xml|pdf|zip)$).*)",
  ],
};
