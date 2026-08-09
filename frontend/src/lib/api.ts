import type { ApiErrorResponse } from "@/types/api";



type ApiRequestErrorOptions = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};


export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;


  constructor({
    status,
    code,
    message,
    details,
  }: ApiRequestErrorOptions) {
    super(message);

    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}


function buildApiUrl(path: string): string {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new ApiRequestError({
      status: 0,
      code: "API_CONFIGURATION_ERROR",
      message:
        "Frontend API configuration is missing.",
    });
  }

  const baseUrl =
    apiBaseUrl.replace(/\/+$/, "");

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}


function isApiErrorResponse(
  value: unknown,
): value is ApiErrorResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("error" in value)
  ) {
    return false;
  }

  const error = (
    value as {
      error?: unknown;
    }
  ).error;

  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const errorObject = error as {
    code?: unknown;
    message?: unknown;
  };

  return (
    typeof errorObject.code === "string" &&
    typeof errorObject.message === "string"
  );
}


async function readApiError(
  response: Response,
): Promise<ApiErrorResponse | null> {
  try {
    const body: unknown =
      await response.json();

    if (isApiErrorResponse(body)) {
      return body;
    }

    return null;
  } catch {
    return null;
  }
}


export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = buildApiUrl(path);

  const headers = new Headers(
    init.headers,
  );

  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "application/json",
    );
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials:
        init.credentials ?? "include",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw new ApiRequestError({
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Unable to reach the application server.",
    });
  }

  if (!response.ok) {
    const body =
      await readApiError(response);

    throw new ApiRequestError({
      status: response.status,
      code:
        body?.error.code ??
        "REQUEST_FAILED",
      message:
        body?.error.message ??
        `Request failed with HTTP ${response.status}.`,
      details: body?.error.details,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}