import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};


export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute -left-32 top-20 size-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Back to home
        </Link>
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden items-center p-8 lg:flex xl:p-12">
          <div className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-violet-600 to-indigo-800 p-10 text-white shadow-2xl shadow-primary/20 xl:p-12">
            <div
              className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />

            <div
              className="absolute -bottom-28 -left-20 size-72 rounded-full bg-cyan-300/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                  <Sparkles
                    className="size-4"
                    aria-hidden="true"
                  />
                </span>

                <span className="font-bold">
                  Place-Mate
                </span>
              </div>

              <h2 className="mt-14 max-w-md text-4xl font-bold tracking-tight">
                Your placement preparation,
                organized in one place.
              </h2>

              <p className="mt-5 max-w-md leading-7 text-white/75">
                Build skills, practice
                interviews, strengthen your
                resume, and understand where
                to focus next.
              </p>

              <div className="mt-10 space-y-4">
                <AuthBenefit
                  icon={BrainCircuit}
                  text="Structured placement preparation"
                />

                <AuthBenefit
                  icon={CheckCircle2}
                  text="Progress connected to your account"
                />

                <AuthBenefit
                  icon={ShieldCheck}
                  text="Secure authenticated sessions"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-24 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <AppBrand />
            </div>

            <Card className="rounded-3xl border-border/70 bg-card/90 shadow-2xl shadow-primary/5 backdrop-blur-xl">
              <CardHeader className="space-y-3 px-6 pt-7 sm:px-8 sm:pt-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {eyebrow}
                </p>

                <CardTitle className="text-2xl tracking-tight sm:text-3xl">
                  {title}
                </CardTitle>

                <CardDescription className="text-sm leading-6">
                  {description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
                {children}

                <div className="mt-6 border-t border-border/70 pt-6 text-center text-sm text-muted-foreground">
                  {footer}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}


function AuthBenefit({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/85">
      <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </span>

      <span>
        {text}
      </span>
    </div>
  );
}