import fs from "node:fs";
import path from "node:path";

import { isImageFilename, uploadDir } from "@/lib/uploads.server";
import type { Route } from "./+types/uploads.$file";

/** Serve cropped, generated images. Names are random, so they can be cached hard. */
export async function loader({ params }: Route.LoaderArgs) {
  const file = params.file ?? "";

  if (!isImageFilename(file)) {
    throw new Response("Not found", { status: 404 });
  }

  try {
    const body = await fs.promises.readFile(path.join(uploadDir, file));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    throw new Response("Not found", { status: 404 });
  }
}
