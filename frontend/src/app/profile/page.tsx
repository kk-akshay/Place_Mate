"use client";

import {
  ArrowLeft,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { AppBrand } from "@/components/app-brand";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { ProfileForm } from "@/features/profile/profile-form";
import { ApiRequestError } from "@/lib/api";
import type {
  ProfileStatus,
  StudentProfile,
} from "@/types/profile";

export default function ProfilePage() {
  const router = useRouter();

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] = useState<StudentProfile | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const loadProfile = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const profileStatus =
          await authFetch<ProfileStatus>(
            "/profiles/me/status"
          );

        if (
          !profileStatus.onboarding_completed
        ) {
          router.replace(
            "/onboarding"
          );

          return;
        }

        const response =
          await authFetch<StudentProfile>(
            "/profiles/me"
          );

        setProfile(response);
      } catch (caughtError) {
        setError(
          caughtError
            instanceof ApiRequestError
            ? caughtError.message
            : "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      authFetch,
      router,
    ]
  );

  useEffect(() => {
    if (
      status === "unauthenticated"
    ) {
      router.replace("/login");
      return;
    }

    if (
      status !== "authenticated"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadProfile();
        },
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    status,
    router,
    loadProfile,
  ]);

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading profile"
            description="Getting your placement preparation profile."
          />
        </div>
      </main>
    );
  }

  if (
    error
    || !profile
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load profile"
            message={
              error
              ?? "Your profile could not be loaded."
            }
            onRetry={() => {
              void loadProfile();
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppBrand />

          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-6 rounded-xl"
        >
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>

        <section className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="size-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-primary">
                Your profile
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Edit placement preferences
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Update your education, target roles,
                companies, skills, strengths and
                preparation goals.
              </p>
            </div>
          </div>
        </section>

        <ProfileForm
          mode="edit"
          initialProfile={profile}
        />
      </div>
    </main>
  );
}