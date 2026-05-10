import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardProvider } from "@/lib/dashboard-context";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    console.log("[dashboard:layout] no session, redirecting to login");
    redirect("/auth/login");
  }

  console.log("[dashboard:layout] session found", {
    userId: session.user.id,
    email: session.user.email,
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true },
    });

    if (!user) {
      console.warn("[dashboard:layout] user not found in DB, redirecting to login", {
        email: session.user.email,
      });
      redirect("/auth/login");
    }

    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.name,
      avatar_url: user.image,
      role: user.role,
      is_approved: user.is_approved,
      provider: user.accounts[0]?.provider || "email",
      created_at: new Date().toISOString(),
    };

    return (
      <DashboardProvider profile={profile}>
        <DashboardShell user={session.user} profile={profile}>
          {children}
        </DashboardShell>
      </DashboardProvider>
    );
  } catch (error) {
    console.error("[dashboard:layout] Prisma query failed", {
      error: error instanceof Error ? error.message : error,
      email: session.user.email,
    });

    // Graceful fallback: render dashboard with session-only data
    // instead of throwing 500 to the user
    const fallbackProfile = {
      id: session.user.id || "",
      email: session.user.email || null,
      full_name: session.user.name || null,
      avatar_url: session.user.image || null,
      role: session.user.role || "user",
      is_approved: session.user.is_approved ?? true,
      provider: "unknown",
      created_at: new Date().toISOString(),
    };

    return (
      <DashboardProvider profile={fallbackProfile}>
        <DashboardShell user={session.user} profile={fallbackProfile}>
          {children}
        </DashboardShell>
      </DashboardProvider>
    );
  }
}
