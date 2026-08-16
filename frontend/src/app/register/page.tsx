"use client";

import type {
  FormEvent,
} from "react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  AuthShell,
} from "@/components/auth/auth-shell";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  useAuth,
} from "@/features/auth/auth-provider";
import {
  ApiRequestError,
} from "@/lib/api";


export default function RegisterPage() {
  const router =
    useRouter();

  const {
    register,
    status,
  } = useAuth();


  const registrationInProgress =
    useRef(false);


  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  useEffect(() => {
    if (
      status
        === "authenticated" &&
      !registrationInProgress
        .current
    ) {
      router.replace(
        "/dashboard",
      );
    }
  }, [
    status,
    router,
  ]);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    setError(null);

    setSubmitting(
      true,
    );


    registrationInProgress
      .current =
      true;


    const form =
      new FormData(
        event.currentTarget,
      );


    try {
      await register({
        fullName:
          String(
            form.get(
              "fullName",
            ) ?? "",
          ),

        email:
          String(
            form.get(
              "email",
            ) ?? "",
          ),

        password:
          String(
            form.get(
              "password",
            ) ?? "",
          ),
      });


      router.replace(
        "/onboarding",
      );

    } catch (error) {
      registrationInProgress
        .current =
        false;


      setError(
        error
          instanceof ApiRequestError
          ? error.message
          : (
              "Unable to create your account."
            ),
      );

    } finally {
      setSubmitting(
        false,
      );
    }
  }


  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your Place-Mate account"
      description="Start building a focused and personalized placement preparation journey."
      footer={
        <p>
          Already have
          an account?{" "}

          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5"
      >
        {error ? (
          <Alert
            variant="destructive"
          >
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : null}


        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full name
          </Label>

          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            minLength={
              2
            }
            maxLength={
              120
            }
            required
            placeholder="Your full name"
            className="h-11 rounded-xl"
          />
        </div>


        <div className="space-y-2">
          <Label htmlFor="email">
            Email address
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-11 rounded-xl"
          />
        </div>


        <div className="space-y-2">
          <Label htmlFor="password">
            Password
          </Label>

          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={
              8
            }
            maxLength={
              128
            }
            required
            placeholder="Minimum 8 characters"
            className="h-11 rounded-xl"
          />
        </div>


        <Button
          type="submit"
          disabled={
            submitting
          }
          className="h-11 w-full rounded-xl shadow-lg shadow-primary/15"
        >
          {submitting
            ? "Creating account..."
            : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}