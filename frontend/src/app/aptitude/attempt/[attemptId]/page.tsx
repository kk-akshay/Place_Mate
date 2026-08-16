"use client";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Send,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

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
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiRequestError } from "@/lib/api";
import type {
  AptitudeAttempt,
  AptitudeResult,
} from "@/types/aptitude";

const SECONDS_PER_QUESTION = 75;
const PREPARATION_ACTIVITY_TYPE =
  "aptitude_attempt";

export default function AptitudeAttemptPage() {
  const router = useRouter();

  const params = useParams<{
    attemptId: string;
  }>();

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    attempt,
    setAttempt,
  ] = useState<AptitudeAttempt | null>(
    null
  );

  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, number>
  >({});

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  /*
   * null = timer has not been initialized yet
   * 0    = timer has genuinely expired
   */
  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState<number | null>(
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

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const submittingRef =
    useRef(false);

  const autoSubmittedRef =
    useRef(false);

  const attemptId =
    params.attemptId;

  const finishPreparationActivity =
    useCallback(
      async (
        sourceId: string,
      ) => {
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
                PREPARATION_ACTIVITY_TYPE,

              source_id:
                sourceId,
            }),
          }
        );
      },
      [
        authFetch,
      ]
    );

  const safelyFinishPreparationActivity =
    useCallback(
      async (
        sourceId: string,
      ) => {
        try {
          await finishPreparationActivity(
            sourceId
          );
        } catch {
          /*
           * This is used only when an attempt is
           * already submitted while the page is
           * loading. Failure here must not prevent
           * access to an existing result.
           */
        }
      },
      [
        finishPreparationActivity,
      ]
    );

  const loadAttempt =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await authFetch<AptitudeAttempt>(
              `/aptitude/attempts/${attemptId}`
            );

          const initialRemaining =
            getRemainingSeconds(
              result.expires_at
            );

          /*
           * Start a reusable preparation activity
           * for this specific aptitude attempt.
           *
           * The backend makes this idempotent using
           * user + activity_type + source_id.
           * Reloading this page therefore does not
           * create duplicate preparation records.
           */
          if (
            initialRemaining > 0
          ) {
            try {
              await authFetch(
                "/preparation/activities/start",
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      module:
                        "aptitude",

                      activity_type:
                        PREPARATION_ACTIVITY_TYPE,

                      source_id:
                        result.id,

                      /*
                       * The initial remaining time
                       * is used rather than blindly
                       * allocating a completely new
                       * test duration on reload.
                       */
                      planned_duration_seconds:
                        Math.min(
                          initialRemaining,

                          result.question_count
                            * SECONDS_PER_QUESTION
                        ),
                    }),
                }
              );
            } catch (
              trackingError
            ) {
              setError(
                trackingError
                  instanceof ApiRequestError
                  ? (
                    `Aptitude loaded, but preparation time tracking could not start: ${trackingError.message}`
                  )
                  : (
                    "Aptitude loaded, but preparation time tracking could not start."
                  )
              );
            }
          }

          setRemainingSeconds(
            initialRemaining
          );

          setAttempt(
            result
          );

          autoSubmittedRef.current =
            false;
        } catch (
          caughtError
        ) {
          if (
            caughtError
              instanceof ApiRequestError
            && caughtError.code
              === "ATTEMPT_ALREADY_SUBMITTED"
          ) {
            await safelyFinishPreparationActivity(
              attemptId
            );

            router.replace(
              `/aptitude/results/${attemptId}`
            );

            return;
          }

          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to load this aptitude attempt."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        attemptId,
        authFetch,
        router,
        safelyFinishPreparationActivity,
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
          void loadAttempt();
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
    loadAttempt,
  ]);

  useEffect(() => {
    if (!attempt) {
      return;
    }

    const expiresAt =
      attempt.expires_at;

    const timer =
      window.setInterval(
        () => {
          setRemainingSeconds(
            getRemainingSeconds(
              expiresAt
            )
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    attempt,
  ]);

  const submitAttempt =
    useCallback(
      async () => {
        if (
          !attempt
          || submittingRef.current
        ) {
          return;
        }

        const currentAttemptId =
          attempt.id;

        submittingRef.current =
          true;

        setSubmitting(
          true
        );

        setError(
          null
        );

        let aptitudeSubmitted =
          false;

        try {
          await authFetch<AptitudeResult>(
            `/aptitude/attempts/${currentAttemptId}/submit`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  answers:
                    Object
                      .entries(
                        answers
                      )
                      .map(
                        ([
                          questionId,
                          selectedOption,
                        ]) => ({
                          question_id:
                            questionId,

                          selected_option:
                            selectedOption,
                        })
                      ),
                }),
            }
          );

          aptitudeSubmitted =
            true;

          /*
           * Only finish preparation after the
           * Aptitude submission itself succeeds.
           *
           * The backend calculates the real elapsed
           * time between start and finish and caps it
           * at the planned duration.
           */
          await finishPreparationActivity(
            currentAttemptId
          );

          router.replace(
            `/aptitude/results/${currentAttemptId}`
          );
        } catch (
          caughtError
        ) {
          /*
           * A previous submission may have succeeded
           * while the preparation finish request
           * failed. Pressing Submit again should
           * repair the tracking record instead of
           * trapping the user on this page.
           */
          if (
            caughtError
              instanceof ApiRequestError
            && caughtError.code
              === "ATTEMPT_ALREADY_SUBMITTED"
          ) {
            try {
              await finishPreparationActivity(
                currentAttemptId
              );

              router.replace(
                `/aptitude/results/${currentAttemptId}`
              );

              return;
            } catch (
              finishError
            ) {
              submittingRef.current =
                false;

              setSubmitting(
                false
              );

              setError(
                finishError
                  instanceof ApiRequestError
                  ? (
                    `Your aptitude attempt is submitted, but preparation time could not be finalized: ${finishError.message}`
                  )
                  : (
                    "Your aptitude attempt is submitted, but preparation time could not be finalized. Please press Submit again."
                  )
              );

              return;
            }
          }

          submittingRef.current =
            false;

          setSubmitting(
            false
          );

          if (
            aptitudeSubmitted
          ) {
            setError(
              caughtError
                instanceof ApiRequestError
                ? (
                  `Your aptitude attempt was submitted, but preparation time could not be finalized: ${caughtError.message}`
                )
                : (
                  "Your aptitude attempt was submitted, but preparation time could not be finalized. Please press Submit again."
                )
            );

            return;
          }

          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to submit this aptitude attempt."
          );
        }
      },
      [
        attempt,
        answers,
        authFetch,
        router,
        finishPreparationActivity,
      ]
    );

  useEffect(() => {
    if (
      !attempt
      || remainingSeconds === null
      || remainingSeconds !== 0
      || loading
      || submittingRef.current
      || autoSubmittedRef.current
    ) {
      return;
    }

    autoSubmittedRef.current =
      true;

    const timer =
      window.setTimeout(
        () => {
          void submitAttempt();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    attempt,
    remainingSeconds,
    loading,
    submitAttempt,
  ]);

  const currentQuestion =
    attempt
      ?.questions[
        currentIndex
      ];

  const answeredCount =
    useMemo(
      () =>
        Object.keys(
          answers
        ).length,
      [
        answers,
      ]
    );

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading attempt"
            description="Preparing your aptitude questions."
          />
        </div>
      </main>
    );
  }

  if (
    error
    && !attempt
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load attempt"
            message={error}
            onRetry={() => {
              void loadAttempt();
            }}
          />
        </div>
      </main>
    );
  }

  if (
    !attempt
    || !currentQuestion
  ) {
    return null;
  }

  const progress =
    (
      (
        currentIndex
        + 1
      )
      /
      attempt.question_count
    )
    * 100;

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <AppBrand />

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-xl px-3 py-1.5"
            >
              <Clock3
                className="size-4"
                aria-hidden="true"
              />

              {remainingSeconds === null
                ? "--:--"
                : formatTime(
                    remainingSeconds
                  )}
            </Badge>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_260px] lg:px-8">
        <section>
          {error ? (
            <p className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Question{" "}
                {currentIndex + 1}
                {" "}
                of{" "}
                {attempt.question_count}
              </p>

              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {currentQuestion.category}
                {" · "}
                {currentQuestion.topic}
                {" · "}
                {currentQuestion.difficulty}
              </p>
            </div>

            <span className="text-sm font-semibold">
              {answeredCount}
              /
              {attempt.question_count}
              {" "}
              answered
            </span>
          </div>

          <Progress
            value={progress}
            className="mb-6 h-2"
          />

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-xl leading-8">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {currentQuestion.options.map(
                (
                  option,
                  index
                ) => {
                  const selected =
                    answers[
                      currentQuestion.id
                    ]
                    === index;

                  return (
                    <button
                      key={`${currentQuestion.id}-${index}`}
                      type="button"
                      onClick={() => {
                        setAnswers(
                          (
                            current
                          ) => ({
                            ...current,

                            [
                              currentQuestion.id
                            ]:
                              index,
                          })
                        );
                      }}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/70 bg-background hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      <span className="pt-1 text-sm leading-6">
                        {option}
                      </span>
                    </button>
                  );
                }
              )}

              <div className="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    currentIndex === 0
                  }
                  onClick={() => {
                    setCurrentIndex(
                      (
                        current
                      ) =>
                        Math.max(
                          0,
                          current - 1
                        )
                    );
                  }}
                  className="rounded-xl"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />

                  Previous
                </Button>

                {currentIndex
                  < attempt.question_count - 1 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(
                        (
                          current
                        ) =>
                          Math.min(
                            attempt.question_count
                              - 1,

                            current + 1
                          )
                      );
                    }}
                    className="rounded-xl"
                  >
                    Next

                    <ArrowRight
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      void submitAttempt();
                    }}
                    disabled={
                      submitting
                    }
                    className="rounded-xl"
                  >
                    <Send
                      className="size-4"
                      aria-hidden="true"
                    />

                    {submitting
                      ? "Submitting..."
                      : "Submit attempt"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card className="border-border/70 lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-base">
                Questions
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {attempt.questions.map(
                  (
                    question,
                    index
                  ) => {
                    const answered =
                      answers[
                        question.id
                      ]
                      !== undefined;

                    const active =
                      index
                      === currentIndex;

                    return (
                      <Button
                        key={question.id}
                        type="button"
                        size="icon"
                        variant={
                          active
                            ? "default"
                            : answered
                              ? "secondary"
                              : "outline"
                        }
                        className="size-9 rounded-lg"
                        onClick={() => {
                          setCurrentIndex(
                            index
                          );
                        }}
                      >
                        {index + 1}
                      </Button>
                    );
                  }
                )}
              </div>

              <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>
                    Answered
                  </span>

                  <span className="font-medium text-foreground">
                    {answeredCount}
                    /
                    {attempt.question_count}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>
                    Remaining
                  </span>

                  <span className="font-medium text-foreground">
                    {
                      attempt.question_count
                      - answeredCount
                    }
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full rounded-xl"
                onClick={() => {
                  void submitAttempt();
                }}
                disabled={
                  submitting
                }
              >
                <Send
                  className="size-4"
                  aria-hidden="true"
                />

                {submitting
                  ? "Submitting..."
                  : "Submit"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function getRemainingSeconds(
  expiresAt: string,
): number {
  const expiresAtMs =
    new Date(
      expiresAt
    ).getTime();

  if (
    Number.isNaN(
      expiresAtMs
    )
  ) {
    return 0;
  }

  const difference =
    expiresAtMs
    - Date.now();

  return Math.max(
    0,
    Math.ceil(
      difference / 1000
    )
  );
}

function formatTime(
  seconds: number,
): string {
  const minutes =
    Math.floor(
      seconds / 60
    );

  const remainder =
    seconds % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    remainder
  ).padStart(
    2,
    "0"
  )}`;
}