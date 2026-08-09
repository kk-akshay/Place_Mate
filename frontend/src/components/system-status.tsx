"use client";

import {
  CheckCircle2,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import {
  ErrorState,
} from "@/components/shared/error-state";
import {
  LoadingState,
} from "@/components/shared/loading-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ApiRequestError,
  apiFetch,
} from "@/lib/api";


type ReadyResponse = {
  status: string;
  checks: {
    database: string;
  };
};


type SystemState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };


async function fetchSystemStatus(
  signal?: AbortSignal,
): Promise<string> {
  const data =
    await apiFetch<ReadyResponse>(
      "/health/ready",
      {
        method: "GET",
        cache: "no-store",
        signal,
      },
    );

  if (
    data.status !== "ok" ||
    data.checks.database !== "ok"
  ) {
    throw new ApiRequestError({
      status: 503,
      code: "SYSTEM_NOT_READY",
      message:
        "One or more application services are unavailable.",
    });
  }

  return (
    "Frontend, backend, and database are connected."
  );
}


function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return (
    "The application backend is not reachable."
  );
}


export function SystemStatus() {
  const [state, setState] =
    useState<SystemState>({
      status: "loading",
    });


  useEffect(() => {
    const controller =
      new AbortController();

    void fetchSystemStatus(
      controller.signal,
    )
      .then((message) => {
        if (!controller.signal.aborted) {
          setState({
            status: "ready",
            message,
          });
        }
      })
      .catch((error: unknown) => {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              getErrorMessage(error),
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, []);


  async function handleRetry() {
    setState({
      status: "loading",
    });

    try {
      const message =
        await fetchSystemStatus();

      setState({
        status: "ready",
        message,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          getErrorMessage(error),
      });
    }
  }


  if (state.status === "loading") {
    return (
      <LoadingState
        title="Checking system"
        description="Checking application services."
      />
    );
  }


  if (state.status === "error") {
    return (
      <ErrorState
        title="System unavailable"
        message={state.message}
        onRetry={() => {
          void handleRetry();
        }}
      />
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2
            className="size-5"
            aria-hidden="true"
          />

          System ready
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {state.message}
        </p>
      </CardContent>
    </Card>
  );
}