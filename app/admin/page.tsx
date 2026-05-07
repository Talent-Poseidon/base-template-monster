import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/admin/admin-user-table";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  // Fetch all users (admin role already verified by layout + middleware)
  const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      include: { accounts: true },
  });

  // Map to format expected by table
  const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.name,
      avatar_url: u.image,
      role: u.role,
      is_approved: u.is_approved,
      provider: u.accounts[0]?.provider || "email",
      created_at: new Date().toISOString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or manage user accounts. Users who sign in with Google need approval before they can access the app.
        </p>
      </div>
      <AdminUserTable users={formattedUsers} currentUserId={session.user.id} />
    </div>
  );
}
