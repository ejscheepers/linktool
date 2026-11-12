import { data } from "react-router";

import { BioPage } from "@/components/bio-page";
import { authUrl } from "@/lib/env.server";
import { listLiveLinks } from "@/lib/links.server";
import { getProfile } from "@/lib/profile.server";
import type { Route } from "./+types/_index";

export async function loader({}: Route.LoaderArgs) {
  const profile = getProfile();
  const links = listLiveLinks();

  return data(
    {
      siteUrl: authUrl,
      profile: {
        title: profile.title,
        bio: profile.bio,
        avatarPath: profile.avatarPath,
        avatarUrl: profile.avatarPath ? `/uploads/${profile.avatarPath}` : null,
        backgroundColor: profile.backgroundColor,
        accentColor: profile.accentColor,
        buttonStyle: profile.buttonStyle,
      },
      links: links.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: `/uploads/${item.imagePath}`,
      })),
    },
    {
      // Expired links must disappear immediately, so don't let anything cache
      // this document.
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "Links" }];
  const { profile, siteUrl } = loaderData;
  const description = profile.bio || `Links from ${profile.title}`;
  const image = profile.avatarPath
    ? new URL(profile.avatarUrl ?? "/", siteUrl).toString()
    : undefined;

  return [
    { title: profile.title },
    { name: "description", content: description },
    { property: "og:type", content: "profile" },
    { property: "og:title", content: profile.title },
    { property: "og:description", content: description },
    ...(image ? [{ property: "og:image", content: image }] : []),
    { name: "twitter:card", content: image ? "summary" : "summary_large_image" },
    { name: "twitter:title", content: profile.title },
    { name: "twitter:description", content: description },
  ];
};

export default function PublicPage({ loaderData }: Route.ComponentProps) {
  return <BioPage profile={loaderData.profile} links={loaderData.links} />;
}
