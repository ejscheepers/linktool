import { redirect } from "react-router";

import { auth, copySetCookies } from "@/lib/auth.server";
import type { Route } from "./+types/logout";

export async function loader() {
  throw redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  const response = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });

  return redirect("/", { headers: copySetCookies(response) });
}
