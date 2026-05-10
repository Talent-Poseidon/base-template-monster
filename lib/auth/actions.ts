"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  console.log("[auth:action] signInWithEmail called", { email });

  try {
    const result = await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirect: false,
    });
    console.log("[auth:action] signIn succeeded", { email, result: typeof result });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("[auth:action] AuthError", {
        email,
        type: error.type,
        message: error.message,
      });
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah." };
        default:
          return { error: "Login gagal. Silakan coba lagi." };
      }
    }
    // Re-throw Next.js internal redirect errors (they use .digest property)
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[auth:action] Unexpected error", {
      email,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password) {
      return { error: "Missing fields" };
  }

  try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
          return { error: "User already exists." };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
          data: {
              email,
              password: hashedPassword,
              name: fullName,
              is_approved: false, // Default pending approval
          },
      });

      return { success: true };
  } catch (error) {
      console.error("Signup error:", error);
      return { error: "Failed to create account." };
  }
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/auth/login" });
}
