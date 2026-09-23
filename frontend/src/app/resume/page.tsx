"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  DragEvent,
  useRef,
  useState,
} from "react";

import { AppBrand } from "@/components/app-brand";
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
  ResumeAnalysis,
} from "@/types/resume";


const MAX_FILE_SIZE =
  5 * 1024 * 1024;


export default function ResumePage() {
  const {
    authFetch,
  } = useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    file,
    setFile,
  ] = useState<File | null>(
    null,
  );

  const [
    role,
    setRole,
  ] = useState("");

  const [
    analyzing,
    setAnalyzing,
  ] = useState(false);

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState<
    ResumeAnalysis | null
  >(null);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  function handleFile(
    selectedFile: File | null,
  ) {
    setError(null);

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !==
        "application/pdf"
      && !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setFile(null);

      setError(
        "Please select a PDF resume.",
      );

      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setFile(null);

      setError(
        "Resume PDF must be 5 MB or smaller.",
      );

      return;
    }

    setFile(selectedFile);
    setResult(null);
  }


  function handleFileInput(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0] ??
      null;

    handleFile(selectedFile);
  }


  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDragging(true);
  }


  function handleDragLeave(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDragging(false);
  }


  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0] ??
      null;

    handleFile(droppedFile);
  }


  function removeFile() {
    setFile(null);
    setResult(null);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }


  async function analyzeResume() {
    if (!file) {
      setError(
        "Please select your resume PDF first.",
      );

      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    const activityId =
      crypto.randomUUID();

    let activityStarted = false;

    try {
      /*
       * Start preparation tracking.
       *
       * If tracking fails, we still continue
       * with resume analysis. Resume analysis
       * itself should not be blocked by the
       * optional time-tracking feature.
       */
      try {
        await authFetch(
          "/preparation/activities/start",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                module:
                  "resume",
                activity_type:
                  "resume_analysis",
                source_id:
                  activityId,
                planned_duration_seconds:
                  1800,
              }),
          },
        );

        activityStarted = true;
      } catch {
        /*
         * Do not block resume analysis if
         * preparation tracking fails.
         */
        activityStarted = false;
      }


      /*
       * Send PDF to backend.
       */
      const form =
        new FormData();

      form.append(
        "file",
        file,
      );

      if (
        role.trim()
      ) {
        form.append(
          "target_role",
          role.trim(),
        );
      }


      /*
       * Main Resume Analysis request.
       */
      const analysis =
        await authFetch<ResumeAnalysis>(
          "/resume/analyze",
          {
            method: "POST",
            body: form,
          },
        );

      setResult(
        analysis,
      );


      /*
       * Finish preparation tracking
       * only if it successfully started.
       */
      if (activityStarted) {
        try {
          await authFetch(
            "/preparation/activities/finish",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  activity_type:
                    "resume_analysis",
                  source_id:
                    activityId,
                }),
            },
          );
        } catch {
          /*
           * Analysis already succeeded.
           * A tracking failure should not
           * make the user think analysis failed.
           */
        }
      }
    } catch (
      caughtError
    ) {
      if (
        caughtError instanceof
        ApiRequestError
      ) {
        const status =
          caughtError.status;

        const message =
          caughtError.message;

        const code =
          caughtError.code;

        setError(
          [
            `Resume analysis failed.`,
            status
              ? `HTTP ${status}.`
              : null,
            code
              ? `Code: ${code}.`
              : null,
            message || null,
          ]
            .filter(Boolean)
            .join(" "),
        );
      } else if (
        caughtError instanceof
        Error
      ) {
        setError(
          `Resume analysis failed: ${caughtError.message}`,
        );
      } else {
        setError(
          "Resume analysis failed due to an unknown error.",
        );
      }
    } finally {
      setAnalyzing(false);
    }
  }


  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <AppBrand />
          <ThemeToggle />
        </div>
      </header>


      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Resume Analysis
            </h1>

            <p className="mt-1 text-muted-foreground">
              Get AI-assisted feedback on your resume
              for your target placement role.
            </p>
          </div>
        </div>


        {/* Upload card */}
        <Card className="mt-8 overflow-hidden">
          <CardHeader>
            <CardTitle>
              Upload your resume
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Upload a PDF resume up to 5 MB.
              We&apos;ll extract the text and analyze
              it against your target role.
            </p>
          </CardHeader>


          <CardContent className="space-y-6">
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={
                handleFileInput
              }
            />


            {/* Drop zone */}
            {!file ? (
              <div
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className={[
                  "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all",
                  dragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                ].join(" ")}
              >
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UploadCloud className="size-7" />
                </div>

                <h3 className="mt-4 text-base font-semibold">
                  Drop your resume here
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse from your computer
                </p>

                <Badge
                  variant="secondary"
                  className="mt-4 rounded-full"
                >
                  PDF only · Maximum 5 MB
                </Badge>
              </div>
            ) : (
              /* Selected file */
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFileSize(
                        file.size,
                      )}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={
                      removeFile
                    }
                    disabled={
                      analyzing
                    }
                    aria-label="Remove resume"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-4" />
                  Resume selected and ready for analysis.
                </div>
              </div>
            )}


            {/* Target role */}
            <div className="space-y-2">
              <label
                htmlFor="target-role"
                className="text-sm font-medium"
              >
                Target role
                <span className="ml-1 text-muted-foreground">
                  (optional)
                </span>
              </label>

              <div className="relative">
                <Target className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="target-role"
                  value={role}
                  onChange={(
                    event,
                  ) => {
                    setRole(
                      event.target.value,
                    );
                  }}
                  placeholder="e.g. DevOps Engineer"
                  className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={
                    analyzing
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Leave this empty to use your primary
                target role from your Place-Mate profile.
              </p>
            </div>


            {/* Error */}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

                  <div className="min-w-0">
                    <p className="font-medium text-destructive">
                      Analysis failed
                    </p>

                    <p className="mt-1 text-sm leading-6 text-destructive/90">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* Analyze button */}
            <Button
              type="button"
              disabled={
                !file ||
                analyzing
              }
              onClick={() => {
                void analyzeResume();
              }}
              className="w-full rounded-xl sm:w-auto"
            >
              {analyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing resume...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Analyze resume
                </>
              )}
            </Button>


            {analyzing && (
              <p className="text-xs text-muted-foreground">
                This may take a little while because
                the resume is being extracted and analyzed
                by the AI service.
              </p>
            )}
          </CardContent>
        </Card>


        {/* Results */}
        {result && (
          <div className="mt-8 space-y-5">
            {/* Overview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Target role
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {result.target_role}
                    </h2>
                  </div>

                  <div className="flex size-20 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="text-2xl font-bold">
                      {result.overall_score}
                    </span>

                    <span className="text-xs font-medium">
                      /100
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t pt-5">
                  <p className="leading-7 text-muted-foreground">
                    {result.summary}
                  </p>
                </div>
              </CardContent>
            </Card>


            <ListCard
              title="Strengths"
              items={
                result.strengths
              }
            />


            <ListCard
              title="Weaknesses"
              items={
                result.weaknesses
              }
            />


            <ListCard
              title="Missing keywords"
              items={
                result.missing_keywords
              }
            />


            <ListCard
              title="Suggested improvements"
              items={
                result.suggestions
              }
            />


            <Card>
              <CardHeader>
                <CardTitle>
                  Improved professional summary
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="leading-7 text-muted-foreground">
                  {result.improved_summary}
                </p>
              </CardContent>
            </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>
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
              (
                item,
                index,
              ) => (
                <li
                  key={`${item}-${index}`}
                  className="flex gap-3"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                  <span className="leading-6 text-muted-foreground">
                    {item}
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


function formatFileSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}