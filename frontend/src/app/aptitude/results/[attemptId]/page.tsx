"use client";

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
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
import { useAuth } from "@/features/auth/auth-provider";
import { ApiRequestError } from "@/lib/api";
import type { AptitudeResult } from "@/types/aptitude";

export default function AptitudeResultsPage() {
  const params = useParams<{
    attemptId: string;
  }>();

  const router = useRouter();

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    result,
    setResult,
  ] = useState<AptitudeResult | null>(
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

  const attemptId =
    params.attemptId;

  const loadResult = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await authFetch<AptitudeResult>(
            `/aptitude/attempts/${attemptId}/result`
          );

        setResult(response);
      } catch (caughtError) {
        if (
          caughtError
            instanceof ApiRequestError
          && caughtError.code
            === "ATTEMPT_NOT_SUBMITTED"
        ) {
          router.replace(
            `/aptitude/attempt/${attemptId}`
          );

          return;
        }

        setError(
          caughtError
            instanceof ApiRequestError
            ? caughtError.message
            : "Unable to load aptitude results."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      attemptId,
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
          void loadResult();
        },
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    status,
    router,
    loadResult,
  ]);

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading results"
            description="Calculating your aptitude performance."
          />
        </div>
      </main>
    );
  }

  if (
    error
    || !result
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load results"
            message={
              error
              ?? "Result not found."
            }
            onRetry={() => {
              void loadResult();
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
          <Link href="/aptitude">
            <ArrowLeft className="size-4" />
            Aptitude Practice
          </Link>
        </Button>

        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Attempt complete
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {result.score_percent}%
          </h1>

          <p className="mt-2 text-muted-foreground">
            {result.correct_answers}
            {" "}
            of{" "}
            {result.total_questions}
            {" "}
            answers correct.
          </p>

          {result.timed_out ? (
            <Badge
              variant="outline"
              className="mt-4"
            >
              Time limit reached
            </Badge>
          ) : null}
        </section>

        <section className="mt-8 space-y-5">
          {result.questions.map(
            (question) => (
              <Card
                key={question.question_id}
                className="border-border/70"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs capitalize text-muted-foreground">
                        Question{" "}
                        {question.position}
                        {" · "}
                        {question.topic}
                      </p>

                      <CardTitle className="mt-2 text-lg leading-7">
                        {question.question_text}
                      </CardTitle>
                    </div>

                    {question.is_correct ? (
                      <CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="size-6 shrink-0 text-destructive" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {question.options.map(
                    (
                      option,
                      index
                    ) => {
                      const correct =
                        index
                        === question.correct_option;

                      const selected =
                        index
                        === question.selected_option;

                      return (
                        <div
                          key={`${question.question_id}-${index}`}
                          className={`rounded-xl border p-3 text-sm ${
                            correct
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : selected
                                ? "border-destructive/30 bg-destructive/10"
                                : "border-border/70"
                          }`}
                        >
                          <span className="font-semibold">
                            {String.fromCharCode(
                              65 + index
                            )}
                            .
                          </span>
                          {" "}
                          {option}
                        </div>
                      );
                    }
                  )}

                  <div className="mt-4 rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm font-semibold">
                      Explanation
                    </p>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {question.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-xl"
          >
            <Link href="/aptitude">
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
      </div>
    </main>
  );
}