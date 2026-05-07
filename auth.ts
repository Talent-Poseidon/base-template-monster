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
        if (user) {
            token.role = user.role;
            token.is_approved = user.is_approved;
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
