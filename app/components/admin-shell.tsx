import { ExternalLink, Link2, LogOut, Palette } from "lucide-react";
import { Form, NavLink } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/admin", label: "Links", icon: Link2, end: true },
  { to: "/admin/profile", label: "Page", icon: Palette, end: false },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <NavLink to="/admin" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Link2 className="size-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight">
                Link page admin
              </span>
            </NavLink>

            <div className="flex items-center gap-1 sm:hidden">
              <Button asChild variant="ghost" size="icon">
                <a href="/" target="_blank" rel="noreferrer" aria-label="View page">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
              <Form method="post" action="/logout">
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </Button>
              </Form>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )
                  }
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-1 sm:flex">
              <span className="mr-1 hidden text-xs text-slate-500 md:inline">
                {email}
              </span>
              <Button asChild variant="ghost" size="sm">
                <a href="/" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 size-4" />
                  View
                </a>
              </Button>
              <Form method="post" action="/logout">
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="mr-1.5 size-4" />
                  Sign out
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
