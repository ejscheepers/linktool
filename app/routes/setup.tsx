import { redirect, Form } from "react-router";

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
  hasUser,
} from "@/lib/auth.server";
import type { Route } from "./+types/setup";

export const meta: Route.MetaFunction = () => [{ title: "Create admin account" }];

export async function loader() {
  if (hasUser()) throw redirect("/login");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  if (hasUser()) throw redirect("/login");

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const values = { name, email };

  if (!name) return { error: "Tell us what to call you.", values };
  if (!email.includes("@")) return { error: "Enter a valid email address.", values };
  if (password.length < 8) {
    return { error: "Use at least 8 characters for the password.", values };
  }

  try {
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: request.headers,
      asResponse: true,
    });

    return redirect("/admin", { headers: copySetCookies(response) });
  } catch (error) {
    return { error: authErrorMessage(error), values };
  }
}

export default function Setup({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            This is the only account that can sign in. Choose a strong password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid gap-4">
            {actionData?.error ? (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {actionData.error}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                required
                defaultValue={actionData?.values.name ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={actionData?.values.email ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-slate-500">At least 8 characters.</p>
            </div>

            <Button type="submit" className="w-full">
              Create account
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
