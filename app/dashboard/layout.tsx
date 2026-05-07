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
    redirect("/auth/login");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true },
    });

    if (!user) {
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
    throw error;
  }
}
