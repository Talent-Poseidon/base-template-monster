import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardProvider } from "@/lib/dashboard-context";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    console.log("[admin:layout] no session, redirecting to login");
    redirect("/auth/login");
  }

  console.log("[admin:layout] session found", {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true },
    });

    if (!user || user.role !== "admin") {
      console.warn("[admin:layout] access denied, redirecting to dashboard", {
        email: session.user.email,
        userExists: !!user,
        role: user?.role,
      });
      redirect("/dashboard");
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
    console.error("[admin:layout] Prisma query failed", {
      error: error instanceof Error ? error.message : error,
      email: session.user.email,
    });

    // If DB is unreachable, we can't verify admin role from DB.
    // Fallback: trust JWT role claim (already validated by proxy.ts)
    if (session.user.role !== "admin") {
      redirect("/dashboard");
    }

    const fallbackProfile = {
      id: session.user.id || "",
      email: session.user.email || null,
      full_name: session.user.name || null,
      avatar_url: session.user.image || null,
      role: session.user.role || "admin",
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
