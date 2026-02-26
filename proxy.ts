import { NextRequest, NextResponse } from "next/server";

// Next.js 16: proxy.ts replaces middleware.ts and runs on Node.js runtime
// (not Edge Runtime), so there are no __dirname or crypto-API limitations.

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hkdfDerive(
  secret: string,
  salt: string,
  length: number
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
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
    base,
    length * 8
  );
  return new Uint8Array(bits);
}

async function decryptJWE(
  token: string,
  rawKey: Uint8Array
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [headerB64, , ivB64, ciphertextB64, tagB64] = parts;
  const iv = b64urlDecode(ivB64);
  const ciphertext = b64urlDecode(ciphertextB64);
  const tag = b64urlDecode(tagB64);

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const aad = new TextEncoder().encode(headerB64);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      rawKey.slice(0, 32),
      "AES-GCM",
      false,
      ["decrypt"]
    );
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
      key,
      combined
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

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
    const key = await hkdfDerive(secret, cookieName, 32);
    return await decryptJWE(token, key);
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const session = await getSession(req);

  const isLoggedIn = !!session;
  const isApproved = session?.is_approved as boolean | undefined;
  const { pathname } = req.nextUrl;

  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnPending = pathname.startsWith("/auth/pending-approval");

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
    if (pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
