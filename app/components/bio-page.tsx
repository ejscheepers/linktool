import { ArrowUpRight, Link2 } from "lucide-react";
import type { CSSProperties } from "react";

import { initials, isDark, readableInk, rgba } from "@/lib/colors";
import { cn } from "@/lib/utils";

export type BioProfile = {
  title: string;
  bio: string;
  avatarUrl: string | null;
  backgroundColor: string;
  accentColor: string;
  buttonStyle: string;
};

export type BioLink = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string | null;
};

type BioPageProps = {
  profile: BioProfile;
  links: BioLink[];
  /** Renders sample cards for the admin preview. */
  preview?: boolean;
};

function cardStyles(profile: BioProfile): {
  surface: CSSProperties;
  ink: string;
  border: CSSProperties;
} {
  const darkPage = isDark(profile.backgroundColor);
  const accent = profile.accentColor;

  switch (profile.buttonStyle) {
    case "outline":
      return {
        surface: { backgroundColor: "transparent" },
        ink: readableInk(profile.backgroundColor),
        border: { borderColor: accent, borderWidth: 2, borderStyle: "solid" },
      };
    case "soft":
      return {
        surface: {
          backgroundColor: darkPage ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.60)",
          backdropFilter: "blur(10px)",
        },
        ink: darkPage ? "#f8fafc" : "#0f172a",
        border: {
          borderColor: darkPage ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.85)",
          borderWidth: 1,
          borderStyle: "solid",
        },
      };
    default:
      return {
        surface: {
          backgroundColor: "rgba(255,255,255,0.97)",
          boxShadow: `0 10px 25px -18px ${rgba(profile.accentColor, 0.9)}`,
        },
        ink: "#0f172a",
        border: { borderColor: "rgba(15,23,42,0.06)", borderWidth: 1, borderStyle: "solid" },
      };
  }
}

function Avatar({ profile }: { profile: BioProfile }) {
  const url = profile.avatarUrl;

  if (url) {
    return (
      <img
        src={url}
        alt={profile.title}
        width={96}
        height={96}
        className="size-24 rounded-full object-cover shadow-lg ring-4 ring-white/40"
      />
    );
  }

  return (
    <div
      className="flex size-24 items-center justify-center rounded-full text-3xl font-semibold shadow-lg ring-4 ring-white/40"
      style={{
        backgroundColor: profile.accentColor,
        color: readableInk(profile.accentColor),
      }}
    >
      {initials(profile.title)}
    </div>
  );
}

export function BioPage({ profile, links, preview = false }: BioPageProps) {
  const ink = readableInk(profile.backgroundColor);
  const { surface, ink: cardInk, border } = cardStyles(profile);

  return (
    <div
      className={cn(
        "flex flex-col items-center px-4 py-12 sm:py-16",
        preview ? "min-h-full" : "min-h-screen"
      )}
      style={{ backgroundColor: profile.backgroundColor, color: ink }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <Avatar profile={profile} />

        <h1
          className="text-center text-2xl font-semibold tracking-tight"
          style={{ color: profile.accentColor }}
        >
          {profile.title}
        </h1>

        {profile.bio ? (
          <p className="max-w-sm text-center text-sm leading-relaxed opacity-80">
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-2 flex w-full flex-col gap-3">
          {links.length === 0 ? (
            <p className="py-8 text-center text-sm opacity-60">
              No links are live right now.
            </p>
          ) : (
            links.map((item) => {
              const url = item.imageUrl;
              return (
                <a
                  key={item.id}
                  href={preview ? undefined : `/l/${item.id}`}
                  tabIndex={preview ? -1 : undefined}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl p-3 transition duration-200",
                    "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2",
                    preview && "cursor-default hover:translate-y-0 hover:shadow-none"
                  )}
                  style={{ ...surface, ...border, color: cardInk }}
                >
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex size-14 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: rgba(profile.accentColor, 0.15),
                        color: profile.accentColor,
                      }}
                    >
                      <Link2 className="size-6" aria-hidden="true" />
                    </div>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.title}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-snug opacity-70">
                        {item.description}
                      </span>
                    ) : null}
                  </span>

                  <ArrowUpRight
                    className="size-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-80"
                    style={{ color: profile.accentColor }}
                  />
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
