import { SystemStatus } from "@/components/system-status";


export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="w-full">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            AI Placement Preparation Platform
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
            Production foundation is running.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
            The frontend now communicates with the
            FastAPI backend, and the backend verifies
            connectivity with PostgreSQL.
          </p>

          <div className="mt-10 max-w-2xl">
            <SystemStatus />
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            <ServiceCard
              name="Frontend"
              technology="Next.js"
              port="3000"
            />

            <ServiceCard
              name="Backend"
              technology="FastAPI"
              port="8000"
            />

            <ServiceCard
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
  name: string;
  technology: string;
  port: string;
};


function ServiceCard({
  name,
  technology,
  port,
}: ServiceCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-950">
        {name}
      </p>

      <p className="mt-1 text-sm text-zinc-500">
        {technology}
      </p>

      <p className="mt-3 font-mono text-xs text-zinc-400">
        :{port}
      </p>
    </div>
  );
}