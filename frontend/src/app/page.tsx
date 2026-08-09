import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  Code2,
  FileCheck2,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


const features = [
  {
    title: "Aptitude Practice",
    description:
      "Build confidence across quantitative, logical, and verbal aptitude.",
    icon: BrainCircuit,
  },
  {
    title: "Coding Practice",
    description:
      "Prepare with placement-focused Python problems and structured practice.",
    icon: Code2,
  },
  {
    title: "AI Interviews",
    description:
      "Practice technical and HR interviews in a realistic conversational format.",
    icon: MessageSquareText,
  },
  {
    title: "Resume Analysis",
    description:
      "Review your resume and identify areas that can be strengthened.",
    icon: FileText,
  },
  {
    title: "Progress Analytics",
    description:
      "Understand your preparation activity and improvement across modules.",
    icon: BarChart3,
  },
  {
    title: "Smart Recommendations",
    description:
      "Focus your preparation on the areas that matter most for your goals.",
    icon: WandSparkles,
  },
];


const steps = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Tell Place-Mate about your education, skills, and placement goals.",
  },
  {
    number: "02",
    title: "Practice consistently",
    description:
      "Work through aptitude, coding, resume, and interview preparation.",
  },
  {
    number: "03",
    title: "Improve with insight",
    description:
      "Use your performance and feedback to decide what to focus on next.",
  },
];


const benefits = [
  "One workspace for your core placement preparation",
  "Personalized preparation based on your profile",
  "Clear progress instead of disconnected practice",
  "AI-assisted interview and resume preparation",
];


export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppBrand />

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
            <Link
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </Link>

            <Link
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </Link>

            <Link
              href="#benefits"
              className="transition-colors hover:text-foreground"
            >
              Benefits
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/login">
                Sign in
              </Link>
            </Button>

            <Button
              className="rounded-xl shadow-md shadow-primary/15"
              asChild
            >
              <Link href="/register">
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>


      <section className="relative isolate">
        <div
          className="pointer-events-none absolute -left-40 top-0 -z-10 size-[32rem] rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-40 top-40 -z-10 size-[28rem] rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
              <Sparkles
                className="size-4"
                aria-hidden="true"
              />

              AI-powered placement preparation
            </div>

            <h1 className="mt-7 max-w-3xl text-balance text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl xl:text-7xl">
              Prepare smarter.

              <span className="block bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                Get placement-ready.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Place-Mate brings aptitude,
              coding, interviews, resume
              preparation, and progress
              insights together in one
              focused platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-xl px-6 shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
                asChild
              >
                <Link href="/register">
                  Start preparing free

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl bg-background/60 px-6 backdrop-blur"
                asChild
              >
                <Link href="/login">
                  I already have an account
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-5 border-t border-border/70 pt-7">
              <HeroStat
                value="5+"
                label="Preparation areas"
              />

              <HeroStat
                value="1"
                label="Connected workspace"
              />

              <HeroStat
                value="24/7"
                label="Self-paced access"
              />
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>


      <section
        id="features"
        className="border-y border-border/70 bg-muted/30"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Everything you need"
            title="One platform for the placement journey"
            description="Instead of jumping between unrelated tools, prepare across the core areas recruiters evaluate."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(
              ({
                title,
                description,
                icon: Icon,
              }) => (
                <Card
                  key={title}
                  className="group border-border/70 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <CardHeader>
                    <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon
                        className="size-5"
                        aria-hidden="true"
                      />
                    </div>

                    <CardTitle className="text-lg">
                      {title}
                    </CardTitle>

                    <CardDescription className="leading-6">
                      {description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>


      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <SectionHeading
          eyebrow="Simple workflow"
          title="From profile to preparation"
          description="Place-Mate is designed to make the next useful step obvious instead of overwhelming you with disconnected content."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map(
            ({
              number,
              title,
              description,
            }) => (
              <div
                key={number}
                className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-5xl font-black tracking-tighter text-primary/10">
                  {number}
                </span>

                <h3 className="mt-8 text-xl font-semibold">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {description}
                </p>
              </div>
            ),
          )}
        </div>
      </section>


      <section
        id="benefits"
        className="bg-muted/30"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Built around progress
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Spend more time improving,
              less time deciding what to
              practice.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Your preparation should feel
              connected. Place-Mate is being
              built around your profile,
              practice history, and placement
              goals.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map(
                (benefit) => (
                  <div
                    key={benefit}
                    className="flex gap-3"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Check
                        className="size-4"
                        aria-hidden="true"
                      />
                    </span>

                    <p className="text-sm font-medium sm:text-base">
                      {benefit}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <Card className="overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
            <div className="bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-400/10 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <HighlightCard
                  icon={Target}
                  title="Goal focused"
                  description="Prepare around the roles and companies you are targeting."
                />

                <HighlightCard
                  icon={TrendingUp}
                  title="Progress aware"
                  description="Build a clear view of what you have practiced and improved."
                />

                <HighlightCard
                  icon={FileCheck2}
                  title="Career ready"
                  description="Connect resume, technical, and interview preparation."
                />

                <HighlightCard
                  icon={ShieldCheck}
                  title="Private account"
                  description="Your preparation stays connected to your authenticated profile."
                />
              </div>
            </div>
          </Card>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-center shadow-sm sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            One connected workspace
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight">
            Designed around the skills
            placement candidates actually
            need to prepare.
          </h2>

          <div className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Aptitude",
              "Coding",
              "Interviews",
              "Resume",
            ].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-muted/70 px-4 py-4 text-sm font-semibold"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </section>


      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-violet-600 to-indigo-700 px-6 py-12 text-white shadow-2xl shadow-primary/20 sm:px-10 lg:px-14 lg:py-16">
          <div
            className="absolute right-0 top-0 size-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Start your preparation
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Build your placement
                preparation in one place.
              </h2>

              <p className="mt-4 max-w-xl text-white/75">
                Create your account and
                start building your
                personalized preparation
                journey.
              </p>
            </div>

            <Button
              size="lg"
              variant="secondary"
              className="h-12 shrink-0 rounded-xl px-6"
              asChild
            >
              <Link href="/register">
                Create account

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>
      </section>


      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <AppBrand />

          <p>
            Placement preparation,
            organized.
          </p>
        </div>
      </footer>
    </main>
  );
}


function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <p className="text-xl font-bold sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}


function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute inset-8 -z-10 rounded-full bg-primary/20 blur-3xl" />

      <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/85 shadow-2xl shadow-primary/10 backdrop-blur">
        <CardHeader className="border-b border-border/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Place-Mate Dashboard
              </p>

              <CardTitle className="mt-2">
                Your preparation
              </CardTitle>
            </div>

            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles
                className="size-5"
                aria-hidden="true"
              />
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            <PreviewMetric
              label="Practice"
              value="Focused"
            />

            <PreviewMetric
              label="Progress"
              value="Tracked"
            />

            <PreviewMetric
              label="Guidance"
              value="Smart"
            />
          </div>

          <div className="mt-5 space-y-3">
            <PreviewModule
              icon={BrainCircuit}
              label="Aptitude Practice"
              detail="Quantitative · Logical · Verbal"
              progress="72%"
            />

            <PreviewModule
              icon={Code2}
              label="Coding Practice"
              detail="Python · Problem solving"
              progress="58%"
            />

            <PreviewModule
              icon={MessageSquareText}
              label="Interview Preparation"
              detail="Technical · HR"
              progress="44%"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/70 p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}


function PreviewModule({
  icon: Icon,
  label,
  detail,
  progress,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  progress: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {label}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </div>

        <span className="text-xs font-semibold text-primary">
          {progress}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
          style={{
            width: progress,
          }}
        />
      </div>
    </div>
  );
}


function HighlightCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur">
      <Icon
        className="size-5 text-primary"
        aria-hidden="true"
      />

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}


function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}