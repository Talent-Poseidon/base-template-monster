import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password || "");
          if (passwordsMatch) {
              // We return the user even if not approved, 
              // middleware will handle the redirection to pending page.
              return user;
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
        // Allow OAuth without password check.
        // We do NOT block here based on approval, because blocking here 
        // causes a generic "Sign in failed" error.
        // Instead, we allow sign in, and let middleware redirect to /pending-approval
        return true;
    },
    async jwt({ token, user }) {
        // Initial sign in
        if (user) {
            token.role = user.role;
            token.is_approved = user.is_approved;
        }
        // Subsequent token updates - fetch fresh data from DB to check approval status
        // This ensures if admin approves, user gets access without re-login (eventually)
        if (token.sub) {
             const dbUser = await prisma.user.findUnique({ 
                 where: { id: token.sub },
                 select: { is_approved: true, role: true }
             });
             if (dbUser) {
                 token.is_approved = dbUser.is_approved;
                 token.role = dbUser.role;
             }
        }
        return token;
    },
    async session({ session, token }) {
        if (token && session.user) {
            session.user.id = token.sub as string;
            session.user.email = token.email as string;
            session.user.role = token.role as string;
            session.user.is_approved = token.is_approved as boolean;
        }
        return session;
    }
  }
});
