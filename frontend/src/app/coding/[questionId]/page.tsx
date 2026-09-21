"use client";

import {
  ArrowLeft,
  Braces,
  CheckCircle2,
  Clock3,
  Code2,
  Loader2,
  Play,
  RotateCcw,
  Send,
  TerminalSquare,
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
import type {
  CodingExecutionResult,
  CodingQuestion,
  CodingVisibleTestResult,
} from "@/types/coding";


type ExecutionMode =
  | "run"
  | "submit";


export default function CodingProblemPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      questionId: string;
    }>();

  const questionId =
    params.questionId;

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    question,
    setQuestion,
  ] = useState<
    CodingQuestion | null
  >(null);

  const [
    code,
    setCode,
  ] = useState(
    "",
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    executing,
    setExecuting,
  ] = useState<
    ExecutionMode | null
  >(null);

  const [
    executionResult,
    setExecutionResult,
  ] = useState<
    CodingExecutionResult | null
  >(null);

  const [
    executionError,
    setExecutionError,
  ] = useState<
    string | null
  >(null);


  const loadQuestion =
    useCallback(
      async () => {
        if (!questionId) {
          return;
        }

        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const result =
            await authFetch<CodingQuestion>(
              `/coding/questions/${questionId}`,
            );

          setQuestion(
            result,
          );

          setCode(
            result.starter_code,
          );

        } catch (caughtError) {
          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : (
                  "Unable to load this "
                  + "coding problem."
                ),
          );

        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        authFetch,
        questionId,
      ],
    );


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
      || !questionId
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadQuestion();
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    status,
    router,
    questionId,
    loadQuestion,
  ]);


  function resetCode() {
    if (!question) {
      return;
    }

    setCode(
      question.starter_code,
    );

    setExecutionResult(
      null,
    );

    setExecutionError(
      null,
    );
  }


  async function executeCode(
    mode: ExecutionMode,
  ) {
    if (
      !questionId
      || !code.trim()
      || executing
    ) {
      return;
    }

    setExecuting(
      mode,
    );

    setExecutionError(
      null,
    );

    setExecutionResult(
      null,
    );

    try {
      const result =
        await authFetch<CodingExecutionResult>(
          `/coding/questions/${questionId}/${mode}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  code,
                },
              ),
          },
        );

      setExecutionResult(
        result,
      );

    } catch (caughtError) {
      setExecutionError(
        caughtError
          instanceof ApiRequestError
          ? caughtError.message
          : (
              "Unable to execute "
              + "your code."
            ),
      );

    } finally {
      setExecuting(
        null,
      );
    }
  }


  if (
    status
      === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading coding problem"
            description="Preparing the problem and Python workspace."
          />
        </div>
      </main>
    );
  }


  if (error) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load problem"
            message={error}
            onRetry={() => {
              void loadQuestion();
            }}
          />

          <div className="mt-5">
            <Button
              variant="outline"
              className="rounded-xl"
              asChild
            >
              <Link href="/coding">
                <ArrowLeft className="size-4" />

                Back to questions
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }


  if (!question) {
    return null;
  }


  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <AppBrand />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              asChild
            >
              <Link href="/coding">
                <ArrowLeft className="size-4" />

                <span className="hidden sm:inline">
                  Problems
                </span>
              </Link>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-border/70 bg-background p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge
                difficulty={
                  question.difficulty
                }
              />

              <Badge
                variant="outline"
                className="capitalize"
              >
                {formatLabel(
                  question.topic,
                )}
              </Badge>

              <Badge variant="secondary">
                Python
              </Badge>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {question.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4" />

            Coding practice
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <div className="space-y-6">
            <Card className="border-border/70">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Braces className="size-4" />
                  </div>

                  <CardTitle>
                    Problem
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                  {
                    question
                      .problem_statement
                  }
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <InformationCard
                title="Input format"
                value={
                  question.input_format
                }
              />

              <InformationCard
                title="Output format"
                value={
                  question.output_format
                }
              />
            </div>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">
                  Constraints
                </CardTitle>
              </CardHeader>

              <CardContent>
                <pre className="whitespace-pre-wrap rounded-2xl bg-muted/60 p-4 font-mono text-sm leading-6">
                  {
                    question
                      .constraints
                  }
                </pre>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>
                    Sample test cases
                  </CardTitle>

                  <Badge variant="secondary">
                    {
                      question
                        .sample_test_cases
                        .length
                    }
                    {" "}
                    visible
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {
                  question
                    .sample_test_cases
                    .map(
                      (
                        testCase,
                      ) => (
                        <div
                          key={
                            testCase.position
                          }
                          className="overflow-hidden rounded-2xl border border-border/70"
                        >
                          <div className="border-b border-border/70 bg-muted/40 px-4 py-3">
                            <p className="text-sm font-semibold">
                              Sample{" "}
                              {
                                testCase
                                  .position
                              }
                            </p>
                          </div>

                          <div className="grid gap-px bg-border md:grid-cols-2">
                            <SampleValue
                              title="Input"
                              value={
                                testCase
                                  .input_data
                              }
                            />

                            <SampleValue
                              title="Expected output"
                              value={
                                testCase
                                  .expected_output
                              }
                            />
                          </div>
                        </div>
                      ),
                    )
                }
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <Card className="overflow-hidden border-border/70">
              <CardHeader className="border-b border-border/70 bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Code2 className="size-5 text-primary" />

                      <CardTitle>
                        Python editor
                      </CardTitle>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Write and test your solution.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={
                      executing
                      !== null
                    }
                    onClick={
                      resetCode
                    }
                  >
                    <RotateCcw className="size-4" />

                    Reset
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="border-b border-border/70 bg-zinc-950 px-4 py-2 text-xs text-zinc-400">
                  main.py
                </div>

                <textarea
                  value={code}
                  onChange={(
                    event,
                  ) => {
                    setCode(
                      event.target.value,
                    );
                  }}
                  spellCheck={false}
                  aria-label="Python solution editor"
                  className="min-h-[520px] w-full resize-y border-0 bg-zinc-950 p-5 font-mono text-sm leading-6 text-zinc-100 outline-none"
                />
              </CardContent>

              <div className="border-t border-border/70 bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TerminalSquare className="size-4" />

                    Runs inside an isolated
                    Python container
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={
                        executing
                          !== null
                        || !code.trim()
                      }
                      onClick={() => {
                        void executeCode(
                          "run",
                        );
                      }}
                    >
                      {
                        executing
                          === "run"
                          ? (
                              <Loader2 className="size-4 animate-spin" />
                            )
                          : (
                              <Play className="size-4" />
                            )
                      }

                      {
                        executing
                          === "run"
                          ? "Running..."
                          : "Run code"
                      }
                    </Button>

                    <Button
  type="button"
  className="rounded-xl"
  disabled={
    executing !== null
    || !code.trim()
  }
  onClick={() => {
    void executeCode("submit");
  }}
>
  {
    executing === "submit"
      ? (
          <Loader2 className="size-4 animate-spin" />
        )
      : (
          <Send className="size-4" />
        )
  }

  {
    executing === "submit"
      ? "Submitting..."
      : "Submit"
  }
</Button>
                  </div>
                </div>
              </div>
            </Card>

            {
              executionError
              ? (
                  <Card className="border-destructive/30">
                    <CardContent className="p-5">
                      <p className="font-semibold text-destructive">
                        Execution failed
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {executionError}
                      </p>
                    </CardContent>
                  </Card>
                )
              : null
            }

            {
              executionResult
              ? (
                  <ExecutionResultCard
                    result={
                      executionResult
                    }
                  />
                )
              : null
            }
          </div>
        </div>
      </div>
    </main>
  );
}


function ExecutionResultCard({
  result,
}: {
  result:
    CodingExecutionResult;
}) {
  return (
    <Card
      className={
        result.all_passed
          ? "border-emerald-500/30"
          : "border-border/70"
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>
              {
                result.mode
                  === "run"
                  ? "Sample results"
                  : "Submission result"
              }
            </CardTitle>

            <p className="mt-2 text-sm text-muted-foreground">
              {
                result.passed_tests
              }
              {" / "}
              {
                result.total_tests
              }
              {" tests passed"}
            </p>
          </div>

          {
            result.all_passed
              ? (
                  <CheckCircle2 className="size-7 text-emerald-500" />
                )
              : (
                  <XCircle className="size-7 text-destructive" />
                )
          }
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {
          result.message
            ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  {result.message}
                </div>
              )
            : null
        }

        {
          result.visible_tests.map(
            (
              test,
            ) => (
              <VisibleTestResult
                key={
                  test.position
                }
                test={
                  test
                }
              />
            ),
          )
        }

        {
          result.hidden_total > 0
            ? (
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        Hidden tests
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Hidden inputs and expected
                        outputs remain on the server.
                      </p>
                    </div>

                    <Badge
                      variant={
                        result.hidden_passed
                          === result.hidden_total
                          ? "default"
                          : "secondary"
                      }
                    >
                      {
                        result.hidden_passed
                      }
                      {" / "}
                      {
                        result.hidden_total
                      }
                    </Badge>
                  </div>
                </div>
              )
            : null
        }
      </CardContent>
    </Card>
  );
}


function VisibleTestResult({
  test,
}: {
  test:
    CodingVisibleTestResult;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">
            Test {test.position}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {
              test.execution_time_ms
            }
            {" ms"}
          </p>
        </div>

        {
          test.passed
            ? (
                <Badge>
                  Passed
                </Badge>
              )
            : (
                <Badge variant="destructive">
                  {
                    formatStatus(
                      test.status,
                    )
                  }
                </Badge>
              )
        }
      </div>

      <div className="grid gap-px bg-border md:grid-cols-3">
        <SampleValue
          title="Input"
          value={
            test.input_data
          }
        />

        <SampleValue
          title="Expected"
          value={
            test.expected_output
          }
        />

        <SampleValue
          title="Your output"
          value={
            test.actual_output
              || "(no output)"
          }
        />
      </div>

      {
        test.error
          ? (
              <pre className="overflow-x-auto whitespace-pre-wrap border-t border-border/70 bg-destructive/5 p-4 text-xs text-destructive">
                {test.error}
              </pre>
            )
          : null
      }
    </div>
  );
}


function InformationCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}


function SampleValue({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-background p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>

      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm">
        {value}
      </pre>
    </div>
  );
}


function DifficultyBadge({
  difficulty,
}: {
  difficulty: string;
}) {
  const normalized =
    difficulty.toLowerCase();

  if (
    normalized
    === "easy"
  ) {
    return (
      <Badge
        variant="secondary"
        className="capitalize"
      >
        Easy
      </Badge>
    );
  }

  if (
    normalized
    === "medium"
  ) {
    return (
      <Badge className="capitalize">
        Medium
      </Badge>
    );
  }

  return (
    <Badge
      variant="destructive"
      className="capitalize"
    >
      {difficulty}
    </Badge>
  );
}


function formatLabel(
  value: string,
): string {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character
          .toUpperCase(),
    );
}


function formatStatus(
  value: string,
): string {
  return formatLabel(
    value,
  );
}