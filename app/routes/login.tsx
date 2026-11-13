import { Form, redirect } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  auth,
  authErrorMessage,
  copySetCookies,
  getSession,
  hasUser,
  safeNext,
} from "@/lib/auth.server";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [{ title: "Sign in" }];

export async function loader({ request }: Route.LoaderArgs) {
  // With no admin account there is nothing to sign in to yet.
  if (!hasUser()) throw redirect("/setup");

  const session = await getSession(request);
  if (session) throw redirect("/admin");

  return {
    next: safeNext(new URL(request.url).searchParams.get("next")),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rememberMe = form.get("rememberMe") !== null;
  const next = safeNext(String(form.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password, rememberMe },
      headers: request.headers,
      asResponse: true,
    });

    return redirect(next, { headers: copySetCookies(response) });
  } catch (error) {
    return { error: authErrorMessage(error), email };
  }
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Manage your link page and its links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid gap-4">
            <input type="hidden" name="next" value={loaderData.next} />

            {actionData?.error ? (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {actionData.error}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={actionData?.email ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="rememberMe" className="size-4" />
              Keep me signed in
            </label>

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
