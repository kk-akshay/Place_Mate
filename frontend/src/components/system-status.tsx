"use client";

import { useCallback, useEffect, useState } from "react";

type ConnectionState =
  | "loading"
  | "ready"
  | "error";

type ReadyResponse = {
  status: string;
  checks: {
    database: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;


export function SystemStatus() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("loading");

  const [message, setMessage] = useState(
    "Checking application services...",
  );


  const checkSystem = useCallback(async () => {
    if (!API_BASE_URL) {
      setConnectionState("error");

      setMessage(
        "Frontend API configuration is missing.",
      );

      return;
    }

    setConnectionState("loading");

    setMessage(
      "Checking application services...",
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/health/ready`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`,
        );
      }

      const data =
        (await response.json()) as ReadyResponse;

      if (
        data.status !== "ok" ||
        data.checks.database !== "ok"
      ) {
        throw new Error(
          "One or more services are unavailable.",
        );
      }

      setConnectionState("ready");

      setMessage(
        "Frontend, backend, and database are connected.",
      );
    } catch {
      setConnectionState("error");

      setMessage(
        "The application backend is not reachable.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkSystem();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [checkSystem]);


  if (connectionState === "loading") {
    return (
      <div
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        role="status"
      >
        <div className="mb-4 h-3 w-24 animate-pulse rounded bg-zinc-200" />

        <div className="h-4 w-64 animate-pulse rounded bg-zinc-200" />
      </div>
    );
  }


  if (connectionState === "error") {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6"
        role="alert"
      >
        <p className="font-semibold text-red-900">
          System unavailable
        </p>

        <p className="mt-2 text-sm text-red-700">
          {message}
        </p>

        <button
          type="button"
          onClick={() => void checkSystem()}
          className="mt-5 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }


  return (
    <div
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
      role="status"
    >
      <div className="flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full bg-emerald-500"
          aria-hidden="true"
        />

        <p className="font-semibold text-emerald-950">
          System ready
        </p>
      </div>

      <p className="mt-2 text-sm text-emerald-800">
        {message}
      </p>
    </div>
  );
}