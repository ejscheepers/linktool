import type { Config } from "@react-router/dev/config";

import { allowedActionHosts } from "./app/lib/origins";

export default {
  ssr: true,
  // Coolify terminates TLS in front of the app, so action posts can arrive with
  // an https Origin but an http request URL. List the public host explicitly.
  allowedActionOrigins: allowedActionHosts(),
} satisfies Config;
