import { Sparkles } from "lucide-react";
import Link from "next/link";


type AppBrandProps = {
  href?: string;
};


export function AppBrand({
  href = "/",
}: AppBrandProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-violet-500 to-indigo-600 text-white shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
        <Sparkles
          className="size-4"
          aria-hidden="true"
        />
      </span>

      <span className="text-lg font-bold tracking-tight">
        Place-Mate
      </span>
    </Link>
  );
}