import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ApiRequestError,
  apiFetch,
} from "@/lib/api";


describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });


  it("returns JSON for a successful response", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_BASE_URL",
      "http://localhost:8000/api/v1",
    );

    const fetchMock = vi.fn();

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );


    const result =
      await apiFetch<{
        status: string;
      }>("/health/live");


    expect(result).toEqual({
      status: "ok",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });


  it("converts API errors into ApiRequestError", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_BASE_URL",
      "http://localhost:8000/api/v1",
    );

    const fetchMock = vi.fn();

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message:
              "The requested resource was not found.",
          },
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );


    try {
      await apiFetch("/missing");

      throw new Error(
        "Expected apiFetch to throw.",
      );
    } catch (error) {
      expect(
        error,
      ).toBeInstanceOf(
        ApiRequestError,
      );

      const apiError =
        error as ApiRequestError;

      expect(apiError.status).toBe(404);

      expect(apiError.code).toBe(
        "RESOURCE_NOT_FOUND",
      );

      expect(apiError.message).toBe(
        "The requested resource was not found.",
      );
    }
  });


  it("reports network failures consistently", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_BASE_URL",
      "http://localhost:8000/api/v1",
    );

    const fetchMock = vi.fn();

    fetchMock.mockRejectedValue(
      new TypeError(
        "Failed to fetch",
      ),
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );


    try {
      await apiFetch("/health/ready");

      throw new Error(
        "Expected apiFetch to throw.",
      );
    } catch (error) {
      expect(
        error,
      ).toBeInstanceOf(
        ApiRequestError,
      );

      const apiError =
        error as ApiRequestError;

      expect(apiError.status).toBe(0);

      expect(apiError.code).toBe(
        "NETWORK_ERROR",
      );

      expect(apiError.message).toBe(
        "Unable to reach the application server.",
      );
    }
  });


  it("reports missing frontend configuration", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_BASE_URL",
      "",
    );


    try {
      await apiFetch("/health/live");

      throw new Error(
        "Expected apiFetch to throw.",
      );
    } catch (error) {
      expect(
        error,
      ).toBeInstanceOf(
        ApiRequestError,
      );

      const apiError =
        error as ApiRequestError;

      expect(apiError.code).toBe(
        "API_CONFIGURATION_ERROR",
      );
    }
  });
});