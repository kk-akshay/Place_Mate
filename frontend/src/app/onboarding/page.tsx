"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  AppBrand,
} from "@/components/app-brand";
import {
  LoadingState,
} from "@/components/shared/loading-state";
import {
  ThemeToggle,
} from "@/components/theme-toggle";
import {
  useAuth,
} from "@/features/auth/auth-provider";
import {
  ProfileForm,
} from "@/features/profile/profile-form";
import type {
  ProfileStatus,
} from "@/types/profile";


export default function OnboardingPage() {
  const router =
    useRouter();

  const {
    status,
    authFetch,
  } = useAuth();


  const [
    checkingProfile,
    setCheckingProfile,
  ] = useState(true);


  useEffect(() => {
    if (
      status
      === "unauthenticated"
    ) {
      router.replace(
        "/login",
      );

      return;
    }


    if (
      status
      !== "authenticated"
    ) {
      return;
    }


    let cancelled =
      false;


    void authFetch<ProfileStatus>(
      "/profiles/me/status",
    )
      .then(
        (
          profileStatus,
        ) => {
          if (
            cancelled
          ) {
            return;
          }


          if (
            profileStatus
              .onboarding_completed
          ) {
            router.replace(
              "/dashboard",
            );

            return;
          }


          setCheckingProfile(
            false,
          );
        },
      )
      .catch(
        () => {
          if (
            !cancelled
          ) {
            setCheckingProfile(
              false,
            );
          }
        },
      );


    return () => {
      cancelled =
        true;
    };
  }, [
    status,
    authFetch,
    router,
  ]);


  if (
    status
      === "loading" ||
    status
      === "unauthenticated" ||
    checkingProfile
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <LoadingState
            title="Preparing your profile"
            description="Setting up your personalized Place-Mate workspace."
          />
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <AppBrand />

          <ThemeToggle />
        </div>
      </header>


      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Personalize
            Place-Mate
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Build your
            placement profile.
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Your profile
            gives Place-Mate
            context about
            your education,
            targets, skills,
            and preparation
            goals.
          </p>
        </div>


        <ProfileForm
          mode="onboarding"
        />
      </div>
    </main>
  );
}