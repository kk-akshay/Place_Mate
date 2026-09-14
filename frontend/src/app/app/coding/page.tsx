"use client";

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Code2,
  Search,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
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
  CodingQuestionList,
  CodingQuestionSummary,
} from "@/types/coding";

type DifficultyFilter =
  | "all"
  | "easy"
  | "medium"
  | "hard";

export default function CodingPage() {
  const router = useRouter();

  const {
    status,
    authFetch,
  } = useAuth();

  const [
    questions,
    setQuestions,
  ] = useState<
    CodingQuestionSummary[]
  >([]);

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
    search,
    setSearch,
  ] = useState("");

  const [
    difficulty,
    setDifficulty,
  ] = useState<DifficultyFilter>(
    "all"
  );

  const [
    topic,
    setTopic,
  ] = useState("all");

  const loadQuestions =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await authFetch<CodingQuestionList>(
              "/coding/questions"
            );

          setQuestions(
            result.questions
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError
              instanceof ApiRequestError
              ? caughtError.message
              : "Unable to load coding questions."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        authFetch,
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
          void loadQuestions();
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
    loadQuestions,
  ]);

  const topics =
    useMemo(
      () =>
        Array.from(
          new Set(
            questions.map(
              (
                question
              ) =>
                question.topic
            )
          )
        ).sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second
            )
        ),
      [
        questions,
      ]
    );

  const filteredQuestions =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return questions.filter(
          (
            question
          ) => {
            const matchesDifficulty =
              difficulty === "all"
              || question
                .difficulty
                .toLowerCase()
                === difficulty;

            const matchesTopic =
              topic === "all"
              || question
                .topic
                .toLowerCase()
                === topic
                  .toLowerCase();

            const matchesSearch =
              !normalizedSearch
              || question
                .title
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
              || question
                .topic
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
              || question
                .slug
                .toLowerCase()
                .includes(
                  normalizedSearch
                );

            return (
              matchesDifficulty
              && matchesTopic
              && matchesSearch
            );
          }
        );
      },
      [
        questions,
        difficulty,
        topic,
        search,
      ]
    );

  const easyCount =
    useMemo(
      () =>
        questions.filter(
          (
            question
          ) =>
            question
              .difficulty
              .toLowerCase()
            === "easy"
        ).length,
      [
        questions,
      ]
    );

  const mediumCount =
    useMemo(
      () =>
        questions.filter(
          (
            question
          ) =>
            question
              .difficulty
              .toLowerCase()
            === "medium"
        ).length,
      [
        questions,
      ]
    );

  if (
    status === "loading"
    || loading
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <LoadingState
            title="Loading coding practice"
            description="Preparing your placement coding question bank."
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
            title="Unable to load coding practice"
            message={error}
            onRetry={() => {
              void loadQuestions();
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
        <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Code2 className="size-5" />
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  Coding Practice
                </p>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Build your placement coding skills
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                Practice structured Python problems
                covering the patterns commonly used
                in placement coding rounds.
              </p>
            </div>

            <Badge
              variant="secondary"
              className="w-fit rounded-full px-4 py-2 text-sm"
            >
              {questions.length}
              {" "}
              problems available
            </Badge>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatsCard
            title="Total problems"
            value={questions.length}
            description="Available coding questions"
            icon={Braces}
          />

          <StatsCard
            title="Easy"
            value={easyCount}
            description="Foundation problems"
            icon={Target}
          />

          <StatsCard
            title="Medium"
            value={mediumCount}
            description="Placement-level practice"
            icon={Code2}
          />
        </section>

        <section className="mt-8">
          <Card className="border-border/70">
            <CardContent className="p-5 sm:p-6">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(
                    event
                  ) => {
                    setSearch(
                      event.target.value
                    );
                  }}
                  placeholder="Search by problem or topic..."
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Difficulty
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "all",
                      "easy",
                      "medium",
                      "hard",
                    ] as DifficultyFilter[]
                  ).map(
                    (
                      value
                    ) => (
                      <Button
                        key={value}
                        type="button"
                        variant={
                          difficulty
                            === value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="rounded-full capitalize"
                        onClick={() => {
                          setDifficulty(
                            value
                          );
                        }}
                      >
                        {value}
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Topic
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      topic === "all"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setTopic(
                        "all"
                      );
                    }}
                  >
                    All
                  </Button>

                  {topics.map(
                    (
                      value
                    ) => (
                      <Button
                        key={value}
                        type="button"
                        variant={
                          topic
                            === value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="rounded-full capitalize"
                        onClick={() => {
                          setTopic(
                            value
                          );
                        }}
                      >
                        {formatLabel(
                          value
                        )}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                Question bank
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Choose a problem
              </h2>
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredQuestions.length}
              {" "}
              result
              {filteredQuestions.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {filteredQuestions.length === 0 ? (
            <Card className="border-dashed border-border/80">
              <CardContent className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-semibold">
                  No matching problems
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Try another search term,
                  difficulty, or topic.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 rounded-xl"
                  onClick={() => {
                    setSearch("");
                    setDifficulty(
                      "all"
                    );
                    setTopic(
                      "all"
                    );
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredQuestions.map(
                (
                  question
                ) => (
                  <QuestionCard
                    key={question.id}
                    question={
                      question
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QuestionCard({
  question,
}: {
  question:
    CodingQuestionSummary;
}) {
  return (
    <Card className="group flex h-full flex-col border-border/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
      <CardHeader className="flex-1">
        <div className="flex items-center justify-between gap-3">
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
              question.topic
            )}
          </Badge>
        </div>

        <CardTitle className="mt-4 text-lg">
          {question.title}
        </CardTitle>

        <CardDescription className="leading-6">
          Practice a{" "}
          {formatLabel(
            question.topic
          ).toLowerCase()}
          {" "}
          problem at{" "}
          {question
            .difficulty
            .toLowerCase()}
          {" "}
          difficulty.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          className="w-full rounded-xl"
          asChild
        >
          <Link
            href={`/coding/${question.id}`}
          >
            Open problem

            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
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
    normalized === "easy"
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
    normalized === "medium"
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

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Code2;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatLabel(
  value: string,
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character
          .toUpperCase()
    );
}