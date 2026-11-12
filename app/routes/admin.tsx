import { Outlet } from "react-router";

import { AdminShell } from "@/components/admin-shell";
import { requireUser } from "@/lib/auth.server";
import type { Route } from "./+types/admin";

// React Router routes form posts to the deepest path-contributing match. The
// index route has no path of its own, so /admin mutations arrive here.
export { action } from "./admin._index";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireUser(request);
  return { email: session.user.email };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AdminShell email={loaderData.email}>
      <Outlet />
    </AdminShell>
  );
}
