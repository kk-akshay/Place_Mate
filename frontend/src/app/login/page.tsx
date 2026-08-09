"use client";

import type { FormEvent } from "react";
import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiRequestError } from "@/lib/api";


export default function LoginPage() {
  const router = useRouter();

  const {
    login,
    status,
  } = useAuth();

  const [error, setError] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);


  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [
    status,
    router,
  ]);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    const form = new FormData(
      event.currentTarget,
    );

    try {
      await login({
        email: String(
          form.get("email") ?? "",
        ),
        password: String(
          form.get("password") ?? "",
        ),
      });

      router.replace("/dashboard");
    } catch (error) {
      setError(
        error instanceof ApiRequestError
          ? error.message
          : "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Place-Mate"
      description="Continue your placement preparation from where you left off."
      footer={
        <p>
          New to Place-Mate?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">
            Email address
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-11 rounded-xl bg-background transition-shadow focus-visible:ring-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password
          </Label>

          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="h-11 rounded-xl bg-background transition-shadow focus-visible:ring-2"
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20"
          disabled={submitting}
        >
          {submitting
            ? "Signing in..."
            : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}