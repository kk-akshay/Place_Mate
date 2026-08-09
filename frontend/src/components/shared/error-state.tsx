"use client";

import {
  CircleAlert,
} from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";


type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};


export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" />

      <AlertTitle>
        {title}
      </AlertTitle>

      <AlertDescription>
        <p>{message}</p>

        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}