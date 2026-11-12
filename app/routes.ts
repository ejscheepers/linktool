import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),
  route("l/:id", "./routes/l.$id.ts"),
  route("uploads/:file", "./routes/uploads.$file.ts"),

  route("login", "./routes/login.tsx"),
  route("logout", "./routes/logout.tsx"),
  route("setup", "./routes/setup.tsx"),

  route("admin", "./routes/admin.tsx", [
    index("./routes/admin._index.tsx"),
    route("links/new", "./routes/admin.links.new.tsx"),
    route("links/:id", "./routes/admin.links.$id.tsx"),
    route("profile", "./routes/admin.profile.tsx"),
  ]),

  route("api/auth/*", "./routes/api.auth.$.ts"),
  route("resources/up", "./routes/resources.up.ts"),
  route("*", "./routes/404.tsx"),
] satisfies RouteConfig;
