import type {
  ReactNode,
} from "react";

import {
  Inbox,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";


type EmptyStateProps = {
  title?: string;
  description: string;
  action?: ReactNode;
};


export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Inbox
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-4 font-semibold">
          {title}
        </h3>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>

        {action ? (
          <div className="mt-5">
            {action}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}   