"use client";

import {
  ArrowLeft,
  ClipboardCheck,
  ClipboardList,
  Play,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
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
import { useAuth } from "@/features/auth/auth-provider";
import { ApiRequestError } from "@/lib/api";
import type {
  InterviewKind,
  InterviewSession,
  InterviewSessionList,
  InterviewSessionSummary,
} from "@/types/interview";

const KIND_CONFIG = {
  technical: {
    title: "Technical Interview Practice",
    description:
      "Answer role-based technical questions in writing and get AI feedback on each answer.",
    icon: ClipboardList,
    rolePlaceholder: "e.g. Backend Developer",
  },
  hr: {
    title: "HR Interview Practice",
    description:
      "Answer common HR and behavioural questions in writing and get AI feedback on each answer.",
    icon: ClipboardCheck,
    rolePlaceholder: "e.g. Software Engineer",
  },
} as const;

function isInterviewKind(
  value: string,
): value is InterviewKind {
  return (
    value === "technical"
    || value === "hr"
  );
}

export default function InterviewSetupPage() {
  const router = useRouter();

  const params = useParams<{
    kind: string;
  }>();

  const kind = isInterviewKind(
    params.kind,
  )
    ? params.kind
    : null;

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    sessions,
    setSessions,
  ] = useState<
    InterviewSessionSummary[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    questionCount,
    setQuestionCount,
  ] = useState<3 | 5>(5);

  const [
    role,
    setRole,
  ] = useState("");

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    startError,
    setStartError,
  ] = useState<string | null>(null);

  const loadHistory =
    useCallback(
      async () => {
        if (!kind) {
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const result =
            await authFetch<InterviewSessionList>(
              `/interview/sessions?kind=${kind}`
            );

          setSessions(
            result.sessions
          );
        } catch (caughtError) {
          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to load your practice history."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        authFetch,
        kind,
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
      || !kind
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadHistory();
        },
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    status,
    router,
    kind,
    loadHistory,
  ]);

  async function startSession() {
    if (!kind || starting) {
      return;
    }

    setStarting(true);
    setStartError(null);

    try {
      const created =
        await authFetch<InterviewSession>(
          "/interview/sessions",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              kind,

              question_count:
                questionCount,

              target_role:
                role.trim() || null,
            }),
          }
        );

      router.push(
        `/interview/session/${created.id}`
      );
    } catch (caughtError) {
      setStartError(
        caughtError
          instanceof ApiRequestError
          ? caughtError.message
          : "Unable to prepare your questions."
      );

      setStarting(false);
    }
  }

  if (!kind) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Page not found"
            message="This practice type does not exist."
          />

          <div className="mt-5">
            <Button
              variant="outline"
              className="rounded-xl"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />

                Back to dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const config =
    KIND_CONFIG[kind];

  const Icon = config.icon;

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading practice"
            description="Preparing your practice history."
          />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load practice"
            message={error}
            onRetry={() => {
              void loadHistory();
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppBrand />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl"
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

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8">
          <Icon className="size-8 text-primary" />

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {config.title}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            {config.description}
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>
                Start a practice round
              </CardTitle>

              <CardDescription>
                Questions are written for
                your target role and skills.
                Answer in your own words.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {startError ? (
                <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  {startError}
                </p>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Number of questions
                </p>

                <div className="flex gap-2">
                  {([3, 5] as const).map(
                    (count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={
                          questionCount
                            === count
                            ? "default"
                            : "outline"
                        }
                        className="rounded-xl"
                        disabled={starting}
                        onClick={() => {
                          setQuestionCount(
                            count
                          );
                        }}
                      >
                        {count} questions
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="interview-role"
                  className="text-sm font-medium"
                >
                  Target role
                  <span className="ml-1 text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <input
                  id="interview-role"
                  value={role}
                  maxLength={120}
                  disabled={starting}
                  onChange={(event) => {
                    setRole(
                      event.target.value
                    );
                  }}
                  placeholder={
                    config.rolePlaceholder
                  }
                  className="h-11 w-full rounded-xl border bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="text-xs text-muted-foreground">
                  Leave empty to use your
                  primary target role from
                  your profile.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  void startSession();
                }}
                disabled={starting}
                className="h-11 w-full rounded-xl"
              >
                <Play className="size-4" />

                {starting
                  ? "Preparing questions..."
                  : "Start practice"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>
                Your previous rounds
              </CardTitle>

              <CardDescription>
                Open a round to review
                answers and feedback.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No practice rounds yet.
                </p>
              ) : (
                sessions.map(
                  (item) => (
                    <Link
                      key={item.id}
                      href={
                        `/interview/session/${item.id}`
                      }
                      className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-4 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.target_role}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.question_count}
                          {" questions · "}
                          {new Date(
                            item.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {item.status
                        === "submitted"
                        ? (
                          <Badge>
                            {item.overall_score}
                            %
                          </Badge>
                        )
                        : (
                          <Badge variant="secondary">
                            In progress
                          </Badge>
                        )}
                    </Link>
                  )
                )
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}