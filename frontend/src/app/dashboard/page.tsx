"use client";

import {
  BrainCircuit,
  Code2,
  FileText,
  LogOut,
  MessageSquareText,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { AppBrand } from "@/components/app-brand";
import { LoadingState } from "@/components/shared/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";


const modules = [
  {
    title: "Aptitude Practice",
    description:
      "Practice quantitative, logical, and verbal aptitude.",
    icon: BrainCircuit,
  },
  {
    title: "Coding Practice",
    description:
      "Solve placement-focused Python coding problems.",
    icon: Code2,
  },
  {
    title: "Technical Interview",
    description:
      "Practice technical interview questions with AI.",
    icon: MessageSquareText,
  },
  {
    title: "Resume Analysis",
    description:
      "Upload and improve your resume for placements.",
    icon: FileText,
  },
  {
    title: "Progress",
    description:
      "Track your preparation and improvement.",
    icon: TrendingUp,
  },
];


export default function DashboardPage() {
  const router = useRouter();

  const {
    status,
    user,
    logout,
  } = useAuth();

  const [loggingOut, setLoggingOut] =
    useState(false);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [
    status,
    router,
  ]);


  async function handleLogout() {
    setLoggingOut(true);

    await logout();

    router.replace("/login");
  }


  if (
    status === "loading" ||
    status === "unauthenticated" ||
    !user
  ) {
    return (
      <main className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <LoadingState
            title="Loading dashboard"
            description="Restoring your Place-Mate session."
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
            <div className="mr-2 hidden text-right md:block">
              <p className="text-sm font-medium">
                {user.full_name}
              </p>

              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void handleLogout();
              }}
              disabled={loggingOut}
              className="rounded-xl"
            >
              <LogOut
                className="size-4"
                aria-hidden="true"
              />

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
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8 lg:p-10">
          <div
            className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Your dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back,{" "}
              {user.full_name.split(" ")[0]}.
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Your Place-Mate workspace is
              ready. Choose a preparation
              area to continue building
              toward your placement goals.
            </p>
          </div>
        </section>


        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <DashboardStatus
            title="Account"
            value="Active"
            description="Your Place-Mate account is ready."
          />

          <DashboardStatus
            title="Session"
            value="Secure"
            description="Authenticated session is active."
          />

          <DashboardStatus
            title="Preparation"
            value="5 areas"
            description="Your core preparation modules."
          />
        </section>


        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold text-primary">
              Preparation workspace
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Choose where to focus
            </h2>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map(
              ({
                title,
                description,
                icon: Icon,
              }) => (
                <Card
                  key={title}
                  className="group relative overflow-hidden border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                        <Icon
                          className="size-5"
                          aria-hidden="true"
                        />
                      </div>

                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        Coming next
                      </span>
                    </div>

                    <CardTitle className="mt-4 text-lg">
                      {title}
                    </CardTitle>

                    <CardDescription className="min-h-12 leading-6">
                      {description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled
                    >
                      Available soon
                    </Button>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </section>


        <section className="mt-10 pb-8">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>
                Account details
              </CardTitle>

              <CardDescription>
                The account currently
                connected to this Place-Mate
                session.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Full name
                </p>

                <p className="mt-2 font-semibold">
                  {user.full_name}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email address
                </p>

                <p className="mt-2 break-all font-semibold">
                  {user.email}
                </p>
              </div>
            </CardContent>
          </Card>
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
    <Card className="border-border/70 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>

        <p className="mt-2 text-xl font-bold">
          {value}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}