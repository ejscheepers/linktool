import type { authClient } from "./auth-client";

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = Session["user"];
