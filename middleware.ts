import { NextRequest, NextResponse } from "next/server";
import { jwtDecrypt } from "jose";

// Derive the AES-256 decryption key using the same HKDF parameters
// that @auth/core uses internally when encrypting the session JWT.
async function getDecryptionKey(
  secret: string,
  salt: string
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(salt),
      info: enc.encode(
        `Auth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`
      ),
    },
    baseKey,
    256
  );
  return new Uint8Array(bits);
}

// Read and decrypt the next-auth v5 session cookie using jose directly.
// This avoids importing anything from next-auth, which bundles __dirname
// references that crash Vercel Edge Runtime.
async function getSession(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = req.cookies.get(cookieName)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    const key = await getDecryptionKey(secret, cookieName);
    const { payload } = await jwtDecrypt(token, key, { clockTolerance: 15 });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const session = await getSession(req);

  const isLoggedIn = !!session;
  const isApproved = session?.is_approved as boolean | undefined;
  const { pathname } = req.nextUrl;

  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnPending = pathname.startsWith("/auth/pending-approval");

  // Logged in but not yet approved → hold on pending page only
  if (isLoggedIn && !isApproved) {
    if (isOnPending) return NextResponse.next();
    return NextResponse.redirect(
      new URL("/auth/pending-approval", req.nextUrl)
    );
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
