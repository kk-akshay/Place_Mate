"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiRequestError,
  apiFetch,
} from "@/lib/api";
import type {
  AuthResponse,
  User,
} from "@/types/auth";


type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";


type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};


type LoginInput = {
  email: string;
  password: string;
};


type AuthContextValue = {
  status: AuthStatus;
  user: User | null;

  register: (
    input: RegisterInput,
  ) => Promise<void>;

  login: (
    input: LoginInput,
  ) => Promise<void>;

  logout: () => Promise<void>;

  authFetch: <T>(
    path: string,
    init?: RequestInit,
  ) => Promise<T>;
};


const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] =
    useState<AuthStatus>("loading");

  const [user, setUser] =
    useState<User | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);


  const applyAuth = useCallback(
    (response: AuthResponse) => {
      setAccessToken(
        response.access_token,
      );

      setUser(response.user);

      setStatus("authenticated");
    },
    [],
  );


  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);


  const refreshAccessToken =
    useCallback(async () => {
      const response =
        await apiFetch<AuthResponse>(
          "/auth/refresh",
          {
            method: "POST",
          },
        );

      applyAuth(response);

      return response.access_token;
    }, [applyAuth]);


  useEffect(() => {
    let cancelled = false;

    void apiFetch<AuthResponse>(
      "/auth/refresh",
      {
        method: "POST",
      },
    )
      .then((response) => {
        if (!cancelled) {
          applyAuth(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuth();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    applyAuth,
    clearAuth,
  ]);


  const register = useCallback(
    async ({
      fullName,
      email,
      password,
    }: RegisterInput) => {
      const response =
        await apiFetch<AuthResponse>(
          "/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              full_name: fullName,
              email,
              password,
            }),
          },
        );

      applyAuth(response);
    },
    [applyAuth],
  );


  const login = useCallback(
    async ({
      email,
      password,
    }: LoginInput) => {
      const response =
        await apiFetch<AuthResponse>(
          "/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              password,
            }),
          },
        );

      applyAuth(response);
    },
    [applyAuth],
  );


  const logout = useCallback(
    async () => {
      try {
        await apiFetch<void>(
          "/auth/logout",
          {
            method: "POST",
          },
        );
      } finally {
        clearAuth();
      }
    },
    [clearAuth],
  );


  const authFetch = useCallback(
    async <T,>(
      path: string,
      init: RequestInit = {},
    ): Promise<T> => {
      let token = accessToken;

      if (!token) {
        token =
          await refreshAccessToken();
      }


      const request = (
        bearerToken: string,
      ) => {
        const headers =
          new Headers(
            init.headers,
          );

        headers.set(
          "Authorization",
          `Bearer ${bearerToken}`,
        );

        return apiFetch<T>(
          path,
          {
            ...init,
            headers,
          },
        );
      };


      try {
        return await request(token);
      } catch (error) {
        if (
          error
            instanceof ApiRequestError &&
          error.status === 401
        ) {
          const refreshedToken =
            await refreshAccessToken();

          return request(
            refreshedToken,
          );
        }

        throw error;
      }
    },
    [
      accessToken,
      refreshAccessToken,
    ],
  );


  const value =
    useMemo<AuthContextValue>(
      () => ({
        status,
        user,
        register,
        login,
        logout,
        authFetch,
      }),
      [
        status,
        user,
        register,
        login,
        logout,
        authFetch,
      ],
    );


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}
