import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";
import HelloWorld from "@/components/HelloWorld";

export default async function HomePage() {
  console.log("[v0] HomePage rendering, checking Supabase connection...");
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    console.log("[v0] Supabase getUser result:", user ? "authenticated" : "no user");
  } catch (err) {
    console.log("[v0] Supabase error on homepage:", err);
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Boilerplate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            Next.js + Supabase + Mantine Boilerplate
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Fullstack starter template with authentication
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            A production-ready boilerplate with email and Google OAuth authentication,
            admin approval workflow, dashboard, and profile management. Built with
            Next.js, Supabase, Tailwind CSS, and Mantine UI.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* HelloWorld Component */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <HelloWorld />
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
            What is included
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Everything you need to start building your app
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Full Authentication",
                description:
                  "Email/password and Google OAuth with Supabase Auth. Includes sign-in, sign-up, and session management.",
              },
              {
                icon: Users,
                title: "Admin Approval",
                description:
                  "New Google sign-in users require admin approval. Admin panel to manage and approve user accounts.",
              },
              {
                icon: Zap,
                title: "Production Ready",
                description:
                  "RLS policies, env utility, middleware protection, Mantine + Tailwind styling, and clean code structure.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-6">
        <p className="text-center text-xs text-muted-foreground">
          Next.js Fullstack Boilerplate. Built with Supabase, Tailwind CSS, and Mantine UI.
        </p>
      </footer>
    </main>
  );
}
