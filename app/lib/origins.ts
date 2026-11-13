/**
 * Origin allow-lists shared by the React Router config (build time) and
 * better-auth (runtime).
 *
 * Behind a TLS-terminating proxy (Coolify/Traefik/Cloudflare) the browser sends
 * `Origin: https://…` while the Node process may see an `http://…` request URL.
 * React Router rejects action posts when those disagree, so the public host is
 * allowed explicitly.
 *
 * The host comes from BETTER_AUTH_URL, so the same image can serve several
 * deployments on different domains (one brand per app). PRIMARY_HOST is only
 * needed when the app answers on a second host as well — a full URL, e.g.
 * `https://link.example.com`.
 */

function toHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function toOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Hosts (no scheme) React Router should accept actions from. */
export function allowedActionHosts(): string[] {
  const hosts = new Set<string>();

  const primary = process.env.PRIMARY_HOST?.trim();
  if (primary) {
    const host = toHost(primary) ?? primary;
    if (host) hosts.add(host);
  }

  const authUrl = process.env.BETTER_AUTH_URL;
  if (authUrl) {
    const host = toHost(authUrl);
    if (host) hosts.add(host);
  }

  for (const entry of envList("ALLOWED_ACTION_ORIGINS")) {
    hosts.add(toHost(entry) ?? entry);
  }

  return [...hosts];
}

/** Full origins (scheme + host) better-auth should trust. */
export function trustedOrigins(authUrl: string): string[] {
  const origins = new Set<string>();

  const primary = process.env.PRIMARY_HOST?.trim();
  if (primary) {
    const origin = toOrigin(primary);
    if (origin) origins.add(origin);
  }

  const base = toOrigin(authUrl);
  if (base) origins.add(base);

  for (const entry of envList("TRUSTED_ORIGINS")) {
    const origin = toOrigin(entry);
    if (origin) origins.add(origin);
  }

  return [...origins];
}
