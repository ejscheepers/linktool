import { data, Link } from "react-router";

import { Button } from "@/components/ui/button";
import type { Route } from "./+types/404";

export const meta: Route.MetaFunction = () => [{ title: "Page not found" }];

export function loader() {
  return data(null, { status: 404, statusText: "Not found" });
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The link may have expired, or the address is wrong.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go to the page</Link>
        </Button>
      </div>
    </div>
  );
}
