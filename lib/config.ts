/**
 * Site-wide switches.
 *
 * justiceImagesCleared: JUSTICE and JUSTICE (VINYL EDITION) use a photograph
 * by Andre Pfeifer. Keep this `false` until the image rights are confirmed in
 * writing. To publish: put the files in public/media/justice/ (see README),
 * set this to `true`, rebuild and redeploy.
 */
export const justiceImagesCleared = false;

/** Base path for GitHub Pages project sites (e.g. "/minded-gallery"). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a public asset path (e.g. "media/x.webp") with the base path. */
export function asset(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${basePath}/${src.replace(/^\//, "")}`;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://joshkingsofficial-byte.github.io/minded-gallery";
