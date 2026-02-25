import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Use getToken from next-auth/jwt instead of the full NextAuth import.
// The full `next-auth` package contains __dirname references that crash
// Vercel Edge Runtime. next-auth/jwt is pure crypto (jose + hkdf) and
// is fully Edge Runtime compatible.
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isApproved = token?.is_approved as boolean | undefined;
  const { pathname } = req.nextUrl;

  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnPending = pathname.startsWith("/auth/pending-approval");

  // Logged in but not approved → redirect to pending page
  if (isLoggedIn && !isApproved) {
    if (isOnPending) return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/pending-approval", req.nextUrl));
  }

  if (isOnDashboard || isOnAdmin) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  } else if (isLoggedIn) {
    // Redirect authenticated + approved users away from auth pages
    if (pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
