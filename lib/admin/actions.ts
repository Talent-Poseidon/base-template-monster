"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to check admin
async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });
    
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return user;
}

export async function approveUser(userId: string) {
    await checkAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { is_approved: true },
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
}

export async function revokeUser(userId: string) {
    await checkAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { is_approved: false },
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
}

export async function toggleUserRole(userId: string) {
    await checkAdmin();
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return;

    const newRole = targetUser.role === "admin" ? "user" : "admin";
    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
    });
    revalidatePath("/admin");
}
