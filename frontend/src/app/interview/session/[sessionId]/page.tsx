"use client";

import {
  ArrowLeft,
  Loader2,
  Send,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiRequestError } from "@/lib/api";
import type {
  InterviewKind,
  InterviewSession,
} from "@/types/interview";

const MODULE_BY_KIND: Record<
  InterviewKind,
  string
> = {
  technical: "technical_interview",
  hr: "hr_interview",
};

const KIND_TITLE: Record<
  InterviewKind,
  string
> = {
  technical:
    "Technical Interview Practice",
  hr: "HR Interview Practice",
};

const ACTIVITY_TYPE =
  "interview_session";

const SECONDS_PER_QUESTION = 300;

export default function InterviewSessionPage() {
  const router = useRouter();

  const params = useParams<{
    sessionId: string;
  }>();

  const sessionId =
    params.sessionId;

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    session,
    setSession,
  ] = useState<InterviewSession | null>(
    null
  );

  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, string>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);

  const loadSession =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await authFetch<InterviewSession>(
              `/interview/sessions/${sessionId}`
            );

          setSession(result);

          if (
            result.status
            === "in_progress"
          ) {
            try {
              await authFetch(
                "/preparation/activities/start",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    module:
                      MODULE_BY_KIND[
                        result.kind
                      ],

                    activity_type:
                      ACTIVITY_TYPE,

                    source_id:
                      result.id,

                    planned_duration_seconds:
                      result.question_count
                      * SECONDS_PER_QUESTION,
                  }),
                }
              );
            } catch {
              // Time tracking is optional and
              // must not block the practice round.
            }
          }
        } catch (caughtError) {
          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to load this practice round."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        authFetch,
        sessionId,
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
          void loadSession();
        },
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    status,
    router,
    loadSession,
  ]);

  async function submitAnswers() {
    if (
      !session
      || submitting
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result =
        await authFetch<InterviewSession>(
          `/interview/sessions/${session.id}/submit`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              answers:
                session.questions.map(
                  (question) => ({
                    question_id:
                      question.id,

                    answer: (
                      answers[
                        question.id
                      ] ?? ""
                    ).trim(),
                  })
                ),
            }),
          }
        );

      setSession(result);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      try {
        await authFetch(
          "/preparation/activities/finish",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              activity_type:
                ACTIVITY_TYPE,

              source_id:
                result.id,
            }),
          }
        );
      } catch {
        // The evaluation already succeeded; a
        // tracking failure must not hide it.
      }
    } catch (caughtError) {
      setSubmitError(
        caughtError
          instanceof ApiRequestError
          ? caughtError.message
          : "Unable to evaluate your answers."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading practice round"
            description="Preparing your questions."
          />
        </div>
      </main>
    );
  }

  if (
    error
    || !session
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load practice round"
            message={
              error
              ?? "Practice round not found."
            }
            onRetry={() => {
              void loadSession();
            }}
          />
        </div>
      </main>
    );
  }

  const submitted =
    session.status === "submitted";

  const answeredCount =
    session.questions.filter(
      (question) =>
        (
          answers[question.id] ?? ""
        ).trim().length > 0
    ).length;

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppBrand />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl"
            >
              <Link
                href={
                  `/interview/${session.kind}`
                }
              >
                <ArrowLeft className="size-4" />

                <span className="hidden sm:inline">
                  All rounds
                </span>
              </Link>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {KIND_TITLE[session.kind]}
          </p>

          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {session.target_role}
          </h1>

          {submitted ? (
            <div className="mt-5">
              <p className="text-5xl font-bold">
                {session.overall_score}
                %
              </p>

              <p className="mt-3 leading-7 text-muted-foreground">
                {session.summary}
              </p>
            </div>
          ) : (
            <p className="mt-3 leading-7 text-muted-foreground">
              Answer in your own words,
              a few sentences each. You
              can leave a question blank,
              but it will score 0.
            </p>
          )}
        </section>

        {submitted ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <ListCard
              title="Strengths"
              items={session.strengths}
            />

            <ListCard
              title="Areas to improve"
              items={session.improvements}
            />
          </div>
        ) : null}

        <section className="mt-6 space-y-5">
          {session.questions.map(
            (question) => (
              <Card
                key={question.id}
                className="border-border/70"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Question{" "}
                        {question.position}
                      </p>

                      <CardTitle className="mt-2 text-lg leading-7">
                        {
                          question.question_text
                        }
                      </CardTitle>
                    </div>

                    {submitted ? (
                      <Badge className="shrink-0">
                        {question.score}
                        /10
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {submitted ? (
                    <>
                      <div className="rounded-2xl bg-muted/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Your answer
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {question.answer_text
                            ?? "No answer provided."}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          Feedback
                        </p>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {question.feedback}
                        </p>
                      </div>

                      {question.ideal_points
                        .length > 0 ? (
                        <div>
                          <p className="text-sm font-semibold">
                            A strong answer covers
                          </p>

                          <ul className="mt-2 space-y-2">
                            {question.ideal_points.map(
                              (
                                point,
                                index
                              ) => (
                                <li
                                  key={`${question.id}-${index}`}
                                  className="flex gap-3 text-sm leading-6 text-muted-foreground"
                                >
                                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                                  <span>
                                    {point}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <Textarea
                      value={
                        answers[
                          question.id
                        ] ?? ""
                      }
                      maxLength={4000}
                      disabled={submitting}
                      onChange={(event) => {
                        setAnswers(
                          (current) => ({
                            ...current,

                            [question.id]:
                              event.target
                                .value,
                          })
                        );
                      }}
                      placeholder="Type your answer here..."
                      aria-label={
                        `Answer to question ${question.position}`
                      }
                      className="min-h-32"
                    />
                  )}
                </CardContent>
              </Card>
            )
          )}
        </section>

        {submitted ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-xl"
            >
              <Link
                href={
                  `/interview/${session.kind}`
                }
              >
                Practice again
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
              className="rounded-xl"
            >
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {submitError ? (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {answeredCount}
                {" of "}
                {session.questions.length}
                {" answered"}
              </p>

              <Button
                type="button"
                className="rounded-xl"
                disabled={
                  submitting
                  || answeredCount === 0
                }
                onClick={() => {
                  void submitAnswers();
                }}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}

                {submitting
                  ? "Evaluating..."
                  : "Submit for feedback"}
              </Button>
            </div>

            {submitting ? (
              <p className="text-xs text-muted-foreground">
                This may take a little while
                because the AI is reviewing
                your answers.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

function ListCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No items were identified.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map(
              (item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex gap-3"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                  <span className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}