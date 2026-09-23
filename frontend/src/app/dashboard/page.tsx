"use client";

import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  Code2,
  FileText,
  LogOut,
  MessageSquareText,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { AppBrand } from "@/components/app-brand";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiRequestError } from "@/lib/api";
import {
  formatDuration,
  getModuleLabel,
} from "@/lib/duration";
import type {
  WeeklyPreparationSummary,
} from "@/types/preparation";
import type {
  StudentProfile,
} from "@/types/profile";

const modules = [
  {
    title:
      "Aptitude Practice",

    description:
      "Practice quantitative, logical, and verbal aptitude with timed attempts.",

    icon:
      BrainCircuit,

    href:
      "/aptitude",

    available:
      true,
  },
 {
  title:
    "Coding Practice",

  description:
    "Solve placement-focused Python coding problems.",

  icon:
    Code2,

  href:
    "/coding",

  available:
    true,
},
  {
    title:
      "Technical Interview",

    description:
      "Practice technical interview questions with AI.",

    icon:
      MessageSquareText,

    href:
      null,

    available:
      false,
  },
  {
  title: "Resume Analysis",
  description:
    "Upload and improve your resume for placements.",

  icon:
    FileText,

  href:
    "/resume",

  available:
    true,
},
  {
    title:
      "Progress",

    description:
      "Track your preparation and improvement across Place-Mate.",

    icon:
      TrendingUp,

    href:
      null,

    available:
      false,
  },
];

const preparationModuleOrder = [
  "aptitude",
  "coding",
  "technical_interview",
  "hr_interview",
  "resume",
] as const;

export default function DashboardPage() {
  const router =
    useRouter();

  const {
    status,
    user,
    logout,
    authFetch,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] = useState<StudentProfile | null>(
    null
  );

  const [
    preparation,
    setPreparation,
  ] = useState<
    WeeklyPreparationSummary | null
  >(null);

  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(
    true
  );

  const [
    dashboardError,
    setDashboardError,
  ] = useState<string | null>(
    null
  );

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(
    false
  );

  /*
   * One loading function now owns both Profile and
   * Preparation data. This removes the previous
   * duplicated profile-fetch implementation.
   */
  const loadDashboard =
    useCallback(
      async () => {
        setDashboardLoading(
          true
        );

        setDashboardError(
          null
        );

        try {
          const profileResult =
            await authFetch<StudentProfile>(
              "/profiles/me"
            );

          setProfile(
            profileResult
          );

          const preparationResult =
            await authFetch<WeeklyPreparationSummary>(
              "/preparation/weekly"
            );

          setPreparation(
            preparationResult
          );
        } catch (
          caughtError
        ) {
          if (
            caughtError
              instanceof ApiRequestError
            && caughtError.status
              === 404
          ) {
            router.replace(
              "/onboarding"
            );

            return;
          }

          setDashboardError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to load your dashboard."
          );
        } finally {
          setDashboardLoading(
            false
          );
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
      router.replace(
        "/login"
      );

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
          void loadDashboard();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    status,
    router,
    loadDashboard,
  ]);

  async function handleLogout() {
    setLoggingOut(
      true
    );

    await logout();

    router.replace(
      "/login"
    );
  }

  if (
    status === "loading"
    || dashboardLoading
    || status
      === "unauthenticated"
    || !user
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <LoadingState
            title="Loading dashboard"
            description="Preparing your personalized Place-Mate workspace."
          />
        </div>
      </main>
    );
  }

  if (
    dashboardError
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <ErrorState
            title="Unable to load dashboard"
            message={
              dashboardError
            }
            onRetry={() => {
              void loadDashboard();
            }}
          />
        </div>
      </main>
    );
  }

  if (
    !profile
    || !preparation
  ) {
    return null;
  }

  const firstName =
    user
      .full_name
      .trim()
      .split(
        " "
      )[0];

  const primaryRole =
    profile
      .target_roles[0]
    ?? "Placement candidate";

  const moduleSummaryMap =
    new Map(
      preparation.modules.map(
        (
          module
        ) => [
          module.module,
          module,
        ]
      )
    );

  const displayedUsedPercent =
    Math.min(
      100,
      Math.max(
        0,
        preparation.used_percent
      )
    );

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppBrand />

          <div className="flex items-center gap-2">
            <div className="mr-2 hidden text-right md:block">
              <p className="text-sm font-medium">
                {user.full_name}
              </p>

              <p className="text-xs text-muted-foreground">
                {primaryRole}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              asChild
            >
              <Link href="/profile">
                <UserRound className="size-4" />

                <span className="hidden sm:inline">
                  Profile
                </span>
              </Link>
            </Button>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              disabled={
                loggingOut
              }
              onClick={() => {
                void handleLogout();
              }}
              className="rounded-xl"
            >
              <LogOut className="size-4" />

              <span className="hidden sm:inline">
                {loggingOut
                  ? "Signing out..."
                  : "Sign out"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Your workspace
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back,{" "}
            {firstName}.
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            You&apos;re preparing for{" "}
            <span className="font-semibold text-foreground">
              {primaryRole}
            </span>
            . Place-Mate uses your profile and
            preparation activity to organize your
            weekly placement plan.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {profile.target_roles
              .slice(
                0,
                4
              )
              .map(
                (
                  role
                ) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className="rounded-full px-3 py-1.5"
                  >
                    {role}
                  </Badge>
                )
              )}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatus
            title="Target role"
            value={
              primaryRole
            }
            description="Your primary placement target."
          />

          <DashboardStatus
            title="Weekly target"
            value={
              formatDuration(
                preparation
                  .budget_seconds
              )
            }
            description="Your weekly preparation budget."
          />

          <DashboardStatus
            title="Time spent"
            value={
              formatDuration(
                preparation
                  .spent_seconds
              )
            }
            description="Preparation completed this week."
          />

          <DashboardStatus
            title="Time remaining"
            value={
              formatDuration(
                preparation
                  .remaining_seconds
              )
            }
            description="Preparation time still available this week."
          />
        </section>

        <section className="mt-8">
          <Card className="overflow-hidden border-border/70">
            <CardHeader className="border-b border-border/60">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock3 className="size-4" />
                    </div>

                    <CardTitle className="text-xl">
                      Weekly preparation
                    </CardTitle>
                  </div>

                  <CardDescription className="mt-2">
                    Time actually spent inside
                    Place-Mate preparation modules
                    is deducted from your weekly
                    target.
                  </CardDescription>
                </div>

                <Badge
                  variant="secondary"
                  className="w-fit rounded-full px-3 py-1.5"
                >
                  {preparation.used_percent.toFixed(
                    1
                  )}
                  % used
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Progress
                value={
                  displayedUsedPercent
                }
                className="h-2.5"
              />

              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                <span>
                  {formatDuration(
                    preparation
                      .spent_seconds
                  )}{" "}
                  completed
                </span>

                <span>
                  {formatDuration(
                    preparation
                      .remaining_seconds
                  )}{" "}
                  remaining
                </span>
              </div>

              <div className="mt-7 border-t border-border/60 pt-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Time by module
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      See exactly where your
                      preparation time has gone
                      this week.
                    </p>
                  </div>

                  <span className="text-sm font-medium text-muted-foreground">
                    Total{" "}
                    {formatDuration(
                      preparation
                        .spent_seconds
                    )}
                  </span>
                </div>

                <div className="space-y-3">
                  {preparationModuleOrder.map(
                    (
                      module
                    ) => {
                      const summary =
                        moduleSummaryMap.get(
                          module
                        );

                      const spentSeconds =
                        summary
                          ?.spent_seconds
                        ?? 0;

                      const percentage =
                        summary
                          ?.percentage_of_spent
                        ?? 0;

                      return (
                        <div
                          key={module}
                          className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium">
                              {getModuleLabel(
                                module
                              )}
                            </span>

                            <span className="text-sm font-semibold">
                              {formatDuration(
                                spentSeconds
                              )}
                            </span>
                          </div>

                          <Progress
                            value={
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  percentage
                                )
                              )
                            }
                            className="mt-3 h-1.5"
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">
                Preparation workspace
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Choose where to focus
              </h2>
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              asChild
            >
              <Link href="/profile">
                <Target className="size-4" />
                Update goals
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map(
              (
                module
              ) => {
                const Icon =
                  module.icon;

                return (
                  <Card
                    key={module.title}
                    className="group border-border/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <Icon className="size-5" />
                        </div>

                        <Badge
                          variant={
                            module.available
                              ? "default"
                              : "secondary"
                          }
                        >
                          {module.available
                            ? "Available"
                            : "Coming next"}
                        </Badge>
                      </div>

                      <CardTitle className="mt-4 text-lg">
                        {module.title}
                      </CardTitle>

                      <CardDescription className="min-h-12 leading-6">
                        {module.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {module.available
                        && module.href ? (
                        <Button
                          className="w-full rounded-xl"
                          asChild
                        >
                          <Link
                            href={
                              module.href
                            }
                          >
                            Start practice

                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          disabled
                          className="w-full rounded-xl"
                        >
                          Available soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardStatus({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>

        <p className="mt-2 truncate text-xl font-bold">
          {value}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}