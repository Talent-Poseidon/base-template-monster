"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { TextInput, PasswordInput, Button, Divider, Alert } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth/actions";
import { GoogleIcon } from "@/components/icons/google-icon";

function EmailSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      fullWidth
      size="md"
      loading={pending}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Sign in
    </Button>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      fullWidth
      size="md"
      loading={pending}
      leftSection={<GoogleIcon className="h-4 w-4 bg-transparent" />}
      classNames={{
        root: "border-border text-foreground hover:bg-muted",
      }}
    >
      Sign in with Google
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(formData: FormData) {
    setError(null);
    console.log("[login-form] submitting login...");
    const result = await signInWithEmail(formData);
    console.log("[login-form] server action returned:", JSON.stringify(result));
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      console.log("[login-form] login success, navigating to /dashboard");
      router.push("/dashboard");
    } else {
      console.error("[login-form] unexpected result:", result);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {error && (
        <Alert
          icon={<AlertCircle className="h-4 w-4" />}
          color="red"
          variant="light"
          mb="md"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      <form action={handleEmailLogin}>
        <div className="flex flex-col gap-4">
          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-background border-border text-foreground",
            }}
          />
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Your password"
            required
            size="md"
            classNames={{
              label: "text-foreground text-sm font-medium mb-1",
              input: "bg-background border-border text-foreground",
            }}
          />
          <EmailSubmitButton />
        </div>
      </form>

      <Divider
        label="Or continue with"
        labelPosition="center"
        my="lg"
        classNames={{ label: "text-muted-foreground text-xs" }}
      />

      <form action={handleGoogleLogin}>
        <GoogleSubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
