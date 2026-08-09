import type {
  ReactNode,
} from "react";

import {
  Database,
  Monitor,
  Server,
} from "lucide-react";

import {
  SystemStatus,
} from "@/components/system-status";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="w-full">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Place-Mate
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Application foundation is running.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The frontend communicates with
            FastAPI, and the backend verifies
            connectivity with PostgreSQL.
          </p>

          <div className="mt-10 max-w-2xl">
            <SystemStatus />
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            <ServiceCard
              icon={
                <Monitor
                  className="size-5"
                  aria-hidden="true"
                />
              }
              name="Frontend"
              technology="Next.js"
              port="3000"
            />

            <ServiceCard
              icon={
                <Server
                  className="size-5"
                  aria-hidden="true"
                />
              }
              name="Backend"
              technology="FastAPI"
              port="8000"
            />

            <ServiceCard
              icon={
                <Database
                  className="size-5"
                  aria-hidden="true"
                />
              }
              name="Database"
              technology="PostgreSQL"
              port="5432"
            />
          </div>
        </div>
      </div>
    </main>
  );
}


type ServiceCardProps = {
  icon: ReactNode;
  name: string;
  technology: string;
  port: string;
};


function ServiceCard({
  icon,
  name,
  technology,
  port,
}: ServiceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>

        <CardTitle className="text-base">
          {name}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {technology}
        </p>

        <p className="mt-3 font-mono text-xs text-muted-foreground">
          :{port}
        </p>
      </CardContent>
    </Card>
  );
}