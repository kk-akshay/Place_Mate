"use client";

import {
  ArrowLeft,
  BrainCircuit,
  Clock3,
  Play,
  Target,
  Trophy,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  AppBrand,
} from "@/components/app-brand";
import {
  ErrorState,
} from "@/components/shared/error-state";
import {
  LoadingState,
} from "@/components/shared/loading-state";
import {
  ThemeToggle,
} from "@/components/theme-toggle";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Label,
} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAuth,
} from "@/features/auth/auth-provider";
import {
  ApiRequestError,
} from "@/lib/api";
import type {
  AptitudeAttempt,
  AptitudeCatalog,
  AptitudeCategory,
  AptitudeProgress,
} from "@/types/aptitude";


const categoryLabels:
  Record<
    AptitudeCategory,
    string
  > = {
    mixed:
      "Mixed Practice",

    quantitative:
      "Quantitative Aptitude",

    logical:
      "Logical Reasoning",

    verbal:
      "Verbal Ability",
  };


export default function AptitudePage() {
  const router =
    useRouter();

  const {
    status,
    authFetch,
  } = useAuth();


  const [
    catalog,
    setCatalog,
  ] = useState<
    AptitudeCatalog | null
  >(null);


  const [
    progress,
    setProgress,
  ] = useState<
    AptitudeProgress | null
  >(null);


  const [
    category,
    setCategory,
  ] = useState<
    AptitudeCategory
  >("mixed");


  const [
    questionCount,
    setQuestionCount,
  ] = useState(
    "5",
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );


  const [
    starting,
    setStarting,
  ] = useState(
    false,
  );


  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const loadData =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError(
          null,
        );


        try {
          const [
            catalogResult,
            progressResult,
          ] = await Promise.all([
            authFetch<AptitudeCatalog>(
              "/aptitude/catalog",
            ),

            authFetch<AptitudeProgress>(
              "/aptitude/progress",
            ),
          ]);


          setCatalog(
            catalogResult,
          );

          setProgress(
            progressResult,
          );

        } catch (error) {
          setError(
            error
              instanceof ApiRequestError
              ? error.message
              : (
                  "Unable to load aptitude practice."
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
      === "authenticated"
    ) {
      const timer =
        window.setTimeout(() => {
          void loadData();
        }, 0);

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    }
  }, [
    status,
    router,
    loadData,
  ]);


  async function startAttempt() {
    setStarting(
      true,
    );

    setError(
      null,
    );


    try {
      const attempt =
        await authFetch<AptitudeAttempt>(
          "/aptitude/attempts",
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
                  category,

                  question_count:
                    Number(
                      questionCount,
                    ),
                },
              ),
          },
        );


      router.push(
        `/aptitude/attempt/${attempt.id}`,
      );

    } catch (error) {
      setError(
        error
          instanceof ApiRequestError
          ? error.message
          : (
              "Unable to start aptitude practice."
            ),
      );

    } finally {
      setStarting(
        false,
      );
    }
  }


  if (
    status
      === "loading" ||
    loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading aptitude practice"
            description="Preparing your question bank and progress."
          />
        </div>
      </main>
    );
  }


  if (
    error &&
    !catalog
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <ErrorState
            title="Unable to load aptitude practice"
            message={
              error
            }
            onRetry={() => {
              void loadData();
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


      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8 lg:p-10">
          <BrainCircuit className="size-8 text-primary" />

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Aptitude Practice
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Practice placement-style
            quantitative aptitude,
            logical reasoning, and
            verbal ability with timed
            attempts and detailed
            explanations.
          </p>
        </section>


        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={
              Target
            }
            label="Attempts"
            value={
              String(
                progress
                  ?.total_attempts
                ?? 0,
              )
            }
          />

          <Metric
            icon={
              Trophy
            }
            label="Best score"
            value={
              `${progress?.best_score ?? 0}%`
            }
          />

          <Metric
            icon={
              BrainCircuit
            }
            label="Accuracy"
            value={
              `${progress?.accuracy_percent ?? 0}%`
            }
          />

          <Metric
            icon={
              Clock3
            }
            label="Questions"
            value={
              String(
                progress
                  ?.total_questions
                ?? 0,
              )
            }
          />
        </section>


        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>
                Start a new attempt
              </CardTitle>

              <CardDescription>
                Choose what you want
                to practice.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error ? (
                <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}


              <div className="space-y-2">
                <Label>
                  Category
                </Label>

                <Select
                  value={
                    category
                  }
                  onValueChange={(
                    value,
                  ) => {
                    setCategory(
                      value as AptitudeCategory,
                    );
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {(
                      Object
                        .entries(
                          categoryLabels,
                        )
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <SelectItem
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {
                            label
                          }
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label>
                  Number of questions
                </Label>

                <Select
                  value={
                    questionCount
                  }
                  onValueChange={
                    setQuestionCount
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {(
                      catalog
                        ?.available_question_counts
                      ?? [
                        5,
                        10,
                      ]
                    ).map(
                      (
                        count,
                      ) => (
                        <SelectItem
                          key={
                            count
                          }
                          value={
                            String(
                              count,
                            )
                          }
                        >
                          {
                            count
                          }
                          {" "}
                          questions
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>


              <Button
                onClick={() => {
                  void startAttempt();
                }}
                disabled={
                  starting
                }
                className="h-11 w-full rounded-xl"
              >
                <Play className="size-4" />

                {starting
                  ? "Preparing attempt..."
                  : "Start practice"}
              </Button>
            </CardContent>
          </Card>


          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>
                Question bank
              </CardTitle>

              <CardDescription>
                Questions currently
                available by category.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {catalog
                ?.categories
                .map(
                  (
                    item,
                  ) => (
                    <div
                      key={
                        item.category
                      }
                      className="flex items-center justify-between rounded-2xl bg-muted/60 p-4"
                    >
                      <span className="text-sm font-medium capitalize">
                        {
                          item.category
                        }
                      </span>

                      <span className="text-sm font-bold">
                        {
                          item.question_count
                        }
                      </span>
                    </div>
                  ),
                )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}


function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon:
    typeof Target;

  label:
    string;

  value:
    string;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <Icon className="size-5 text-primary" />

        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-2xl font-bold">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}