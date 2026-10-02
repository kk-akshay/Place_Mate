"use client";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Lightbulb,
  Target,
  TrendingUp,
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
import { formatDuration } from "@/lib/duration";
import type {
  Readiness,
  ReadinessModule,
  RecommendationPriority,
  TopicInsight,
} from "@/types/readiness";

export default function ProgressPage() {
  const router = useRouter();

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    data,
    setData,
  ] = useState<Readiness | null>(
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

  const loadReadiness =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await authFetch<Readiness>(
              "/readiness"
            );

          setData(result);
        } catch (caughtError) {
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

          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to load your progress."
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
          void loadReadiness();
        },
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    status,
    router,
    loadReadiness,
  ]);

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading progress"
            description="Combining your profile and practice results."
          />
        </div>
      </main>
    );
  }

  if (
    error
    || !data
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load progress"
            message={
              error
              ?? "Your progress could not be loaded."
            }
            onRetry={() => {
              void loadReadiness();
            }}
          />
        </div>
      </main>
    );
  }

  const scoredModules =
    data.modules.filter(
      (module) =>
        module.score !== null
    ).length;

  const availableModules =
    data.modules.filter(
      (module) =>
        module.status
        !== "coming_soon"
    ).length;

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppBrand />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />

                <span className="hidden sm:inline">
                  Dashboard
                </span>
              </Link>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <TrendingUp className="size-5" />
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  Progress &amp; readiness
                </p>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {data.level}
              </h1>

              <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
                {data.overall_score === null
                  ? "Complete an aptitude test, a coding problem or a resume analysis to see your readiness."
                  : `Based on ${scoredModules} of ${availableModules} available modules (${data.coverage_percent.toFixed(0)}% coverage). More practice makes this more accurate.`}
              </p>

              {data.target_roles.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {data.target_roles
                    .slice(0, 4)
                    .map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="rounded-full px-3 py-1.5"
                      >
                        {role}
                      </Badge>
                    ))}
                </div>
              ) : null}
            </div>

            <div className="flex size-32 shrink-0 flex-col items-center justify-center rounded-3xl bg-background/70 shadow-sm">
              <span className="text-4xl font-bold">
                {data.overall_score === null
                  ? "--"
                  : data.overall_score.toFixed(0)}
              </span>

              <span className="text-xs font-medium text-muted-foreground">
                / 100
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Module breakdown
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.modules.map(
              (module) => (
                <ModuleCard
                  key={module.key}
                  module={module}
                />
              )
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <InsightCard
            title="Strengths"
            description="Topics where your results are strong."
            empty="Keep practising. Strengths appear once you have enough answered questions."
            items={data.strengths}
            tone="good"
          />

          <InsightCard
            title="Weak areas"
            description="Topics that need more attention."
            empty="No weak topics detected yet."
            items={data.weaknesses}
            tone="weak"
          />
        </section>

        {data.gaps.length > 0 ? (
          <section className="mt-6">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>
                  Preparation gaps
                </CardTitle>

                <CardDescription>
                  Areas you have not started yet.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {data.gaps.map(
                    (gap) => (
                      <li
                        key={gap}
                        className="flex gap-3 text-sm leading-6 text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />

                        {gap}
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />

            <h2 className="text-2xl font-bold tracking-tight">
              Recommended next steps
            </h2>
          </div>

          {data.recommendations.length === 0 ? (
            <Card className="mt-5 border-dashed border-border/80">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No recommendations right now. Keep practising and check back after your next attempt.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-5 space-y-3">
              {data.recommendations.map(
                (item) => (
                  <Card
                    key={`${item.module}-${item.title}`}
                    className="border-border/70"
                  >
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={priorityVariant(
                              item.priority
                            )}
                            className="capitalize"
                          >
                            {item.priority}
                          </Badge>

                          <p className="font-semibold">
                            {item.title}
                          </p>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>

                      {item.href ? (
                        <Button
                          variant="outline"
                          className="shrink-0 rounded-xl"
                          asChild
                        >
                          <Link href={item.href}>
                            Go
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="size-5 text-primary" />

                <CardTitle>
                  Your goals
                </CardTitle>
              </div>

              <CardDescription>
                From your profile.
                {" "}
                <Link
                  href="/profile"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Update goals
                </Link>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <TagList
                items={
                  data.preparation_goals
                }
                variant="secondary"
              />

              {data.declared_weak_areas.length
              > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Areas you want to improve
                  </p>

                  <TagList
                    items={
                      data.declared_weak_areas
                    }
                    variant="outline"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock3 className="size-5 text-primary" />

                <CardTitle>
                  This week
                </CardTitle>
              </div>

              <CardDescription>
                Preparation time against your weekly target.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Progress
                value={Math.min(
                  100,
                  Math.max(
                    0,
                    data.weekly
                      .used_percent
                  )
                )}
                className="h-2.5"
              />

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatDuration(
                    data.weekly
                      .spent_seconds
                  )}{" "}
                  spent
                </span>

                <span>
                  Target{" "}
                  {formatDuration(
                    data.weekly
                      .budget_seconds
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ModuleCard({
  module,
}: {
  module: ReadinessModule;
}) {
  const comingSoon =
    module.status === "coming_soon";

  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">
            {module.label}
          </p>

          {comingSoon ? (
            <Badge variant="secondary">
              Coming soon
            </Badge>
          ) : module.status
            === "not_started" ? (
            <Badge variant="outline">
              Not started
            </Badge>
          ) : (
            <span className="text-lg font-bold">
              {module.score?.toFixed(0)}
              <span className="text-xs font-medium text-muted-foreground">
                {" "}
                /100
              </span>
            </span>
          )}
        </div>

        <Progress
          value={module.score ?? 0}
          className="mt-4 h-1.5"
        />

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {module.summary}
        </p>

        {module.href
        && !comingSoon ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 -ml-2 rounded-xl"
            asChild
          >
            <Link href={module.href}>
              {module.status
              === "not_started"
                ? "Get started"
                : "Practise"}

              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InsightCard({
  title,
  description,
  empty,
  items,
  tone,
}: {
  title: string;
  description: string;
  empty: string;
  items: TopicInsight[];
  tone: "good" | "weak";
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>
          {title}
        </CardTitle>

        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {empty}
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map(
              (item) => (
                <li
                  key={`${item.module}-${item.topic}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {item.topic}
                    </span>

                    <span
                      className={
                        tone === "good"
                          ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                          : "text-sm font-semibold text-destructive"
                      }
                    >
                      {item.score.toFixed(0)}%
                    </span>
                  </div>

                  <Progress
                    value={item.score}
                    className="mt-2 h-1.5"
                  />

                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </li>
              )
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TagList({
  items,
  variant,
}: {
  items: string[];
  variant: "secondary" | "outline";
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing set yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          variant={variant}
          className="rounded-full px-3 py-1.5"
        >
          {item}
        </Badge>
      ))}
    </div>
  );
}

function priorityVariant(
  priority: RecommendationPriority,
): "destructive" | "default" | "secondary" {
  if (priority === "high") {
    return "destructive";
  }

  if (priority === "medium") {
    return "default";
  }

  return "secondary";
}