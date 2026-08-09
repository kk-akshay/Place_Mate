import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


type LoadingStateProps = {
  title?: string;
  description?: string;
};


export function LoadingState({
  title = "Loading",
  description =
    "Please wait while we load the latest information.",
}: LoadingStateProps) {
  return (
    <Card
      aria-busy="true"
      aria-live="polite"
    >
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="sr-only">
          {title}. {description}
        </p>

        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}