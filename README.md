# MINDED: artist website and virtual gallery

The official site of **MINDED**, the artistic identity of Dammy Ojo.
*The Saboteur and Curator of Accidental Errors.*

This repository holds **Phases 1–2** of the build: the visual foundation, the artwork catalogue and an explorable 3D gallery. **Phase 3**, the secure admin dashboard and CMS, is planned below and is **not built yet**.

- Live preview: https://joshkingsofficial-byte.github.io/minded-gallery/
- Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Three.js · React Three Fiber · drei · zustand

---

## What's in Phases 1–2

| Area | Status |
|---|---|
| Home with a cinematic intro (MINDED, then the tagline), Skip Intro, shown once per session, shortened for reduced motion | Built |
| Works catalogue with filters (photography, installation, mixed media, digital art, sculpture, in development) | Built |
| Individual artwork pages with SEO metadata (title, description, Open Graph, JSON-LD), wall label, editions, Enquire button | Built |
| Virtual gallery: Entrance Hall plus Rooms 01–05, curved walls with cove light, reflective floor, deep-green accents | Built |
| Walking with WASD/arrows, drag to look, click-to-walk, collisions, doorways | Built |
| Opening a work (in 3D or with the E key), a detail panel and an enlarged image view | Built |
| Guided tour, free mode, room menu, return home | Built |
| Mobile: touch joystick and swipe-to-look; the guided tour is the default on touch | Built |
| 2D gallery view, plus automatic 2D fallback when WebGL is unavailable | Built |
| Reduced-motion support; optional ambient sound (generated with WebAudio, off by default) | Built |
| Room 04: AURA 001, with a clearly labelled **SIMULATION** of the ART and MIRROR states, plus documentation | Built |
| About, Archive / Process, Literature (*To Fly, Not Fall*, a manuscript in development) | Built |
| Contact form UI (enquiry types, honeypot). **It does not send yet** and says so. | UI only. Sending arrives in Phase 3. |
| Admin dashboard, media uploads, publishing workflow | **Phase 3** |

No prices are shown anywhere on the site, by the artist's instruction. Editions are listed by type only, and "Enquire" leads to Contact.

---

## Project structure

```
app/                     Pages (App Router)
  page.tsx               Home + intro
  works/                 Catalogue + works/[slug] artwork pages
  gallery/               Virtual gallery (3D / 2D)
  about/ archive/ literature/ contact/
components/
  ui/                    Header, footer, cards, labels, figures, intro, contact form
  gallery/               3D scene, architecture meshes, artwork displays, HUD, 2D view, sound
content/                 ALL artwork and exhibition content (JSON) ← edit content here
  artworks.json          Artworks: titles, media, statuses, editions, images
  exhibitions.json       Rooms and which works hang where
  archive.json           Archive / process entries
  aura.json              AURA 001 project text
  literature.json        Writing
  site.json              Tagline, philosophy, filters, enquiry types
lib/
  content.ts             Data layer: the only place content is read (swap for a CMS in Phase 3)
  config.ts              Switches, e.g. justiceImagesCleared, plus the base path
  gallery/architecture.ts  Room geometry, walls, collisions, hanging positions
  gallery/nav.ts         Movement and camera glides
  gallery/tour.ts        Guided tour stops (generated from exhibitions.json)
public/media/            Optimised images (WebP, ≤1600px)
tests/e2e.mjs            Playwright end-to-end checks (desktop and mobile)
```

Content is never hard-coded in components. Every page and the 3D gallery read through `lib/content.ts`, so a CMS can replace the JSON files without touching the UI.

### Adding or changing an artwork (until Phase 3)

1. Put the image in `public/media/` as WebP (max 1600px on the long edge).
2. Add or edit the entry in `content/artworks.json`. Every image needs `alt`, `caption` and `kind` (`photograph`, `visualisation`, `documentation` or `concept`). `kind` controls the label shown on the site, e.g. "Visualisation: artist-supplied mockup".
3. To hang it in the 3D gallery, add a placement to a room in `content/exhibitions.json`. The wall is `L` or `R`, `t` runs from 0 to 1 along the wall, and the display is `deck-frame`, `deck-set`, `image-frame` or `doc`.
4. Commit, then rebuild and deploy (below).

### JUSTICE image rights switch

JUSTICE and JUSTICE (Vinyl Edition) are built on a photograph by **Andre Pfeifer**. Their images are **withheld** until the rights are confirmed in writing, and the site shows a "pending image rights" placeholder instead.

To publish once rights are cleared:
1. Copy the prepared files `deck-justice.webp`, `justice-3x3.webp` and `justice-vinyl.webp` into `public/media/justice/`. They're kept outside this public repo on purpose, and `public/media/justice/` is git-ignored until rights are cleared.
2. In `lib/config.ts`, set `justiceImagesCleared = true`.
3. Remove `public/media/justice/` from `.gitignore`, rebuild and deploy.

---

## Running locally

```bash
npm install
npm run dev            # http://localhost:3100
npm run build          # static export to ./out
```

## Deployment

### Preview (GitHub Pages, current)

The preview is a static export. Build it with the repository base path:

```bash
npm run build:pages    # NEXT_PUBLIC_BASE_PATH=/minded-gallery next build
```

How the preview is published: the built `out/` folder is archived (`tar`), base64-encoded and split into `pack/site.tar.b64.part*` on `main`. The workflow `.github/workflows/publish.yml` checks the archive's SHA-256, unpacks it, adds `.nojekyll` and force-pushes the result to the `gh-pages` branch, which GitHub Pages serves.

To republish after a change:

```bash
npm run build:pages
touch out/.nojekyll
tar -C out -cf - . | base64 -w0 > site.tar.b64
split -b 2600000 -d site.tar.b64 pack/site.tar.b64.part
sha256sum site.tar.b64        # paste this hash into publish.yml
git add pack .github && git commit -m "Publish" && git push
```

Binary images aren't committed directly. `public/media/` is stored as `media-pack/media.tar.b64`; run `bash scripts/unpack-media.sh` after cloning, before building.

### Production (Phase 3, recommended)

Move to **Vercel**: import the repo, set the environment variables below, and remove `output: "export"` from `next.config.ts` so server routes (the contact form, CMS preview) work. Then point your domain at Vercel.

---

## Phase 3 plan: secure admin dashboard and CMS

**Recommendation: Sanity (headless CMS) + Vercel (hosting) + Resend (email) + Cloudflare Turnstile (spam protection).**

Why Sanity: it provides a ready-made, secure, login-protected editing dashboard ("Sanity Studio"). It has a strong image pipeline (uploads, cropping, automatic WebP/AVIF), drafts with preview before publishing, scheduling, and role-based access. It also needs no database server to maintain. The Studio can be embedded at `/admin` on the site itself.

What it will let you do, without code or an AI assistant:
- Upload original artwork images, detail photos and videos
- Add new artworks; edit titles, years, media, dimensions, descriptions and statuses
- Assign works to exhibition rooms and drag them into order
- Create new exhibitions; publish or unpublish works
- Update the artist statement and About text
- Preview changes before publishing
- Read and manage contact enquiries. The form posts to a secure server route, which checks Turnstile, stores the enquiry in Sanity and emails you through Resend. No secret keys are exposed in the browser.

How it plugs in: the Sanity schemas mirror `lib/types.ts`, and `lib/content.ts` swaps its JSON imports for Sanity queries. The pages and gallery stay unchanged. The 3D gallery reads `exhibitions.json`-style room placements from Sanity.

**Accounts Dammy needs (all in Dammy's name, so Dammy owns them):**
1. **Sanity** (sanity.io): free plan to start. This is where you log in to edit the site.
2. **Vercel** (vercel.com): hosting connected to this GitHub repo. Note that Vercel's free Hobby plan is for non-commercial use. A site that takes sales enquiries may need the Pro plan, so check Vercel's current terms.
3. **Resend** (resend.com): sends enquiry emails. Needs a verified domain.
4. **Cloudflare** (for Turnstile spam protection): free.
5. **A domain name** for the site, e.g. through Cloudflare or another registrar.
6. **An email address** where enquiries should arrive.
7. Access to this **GitHub** repo (already set up).

Alternative: **Payload CMS** (open source, runs inside the same Next.js app, with its own admin and auth). It needs a hosted database (e.g. Neon Postgres or MongoDB Atlas) and storage (e.g. S3 or Vercel Blob). It's more control, with more to maintain.

---

## Files still needed from the artist

- **LONELY**: the exact original photograph (full resolution), plus genuine photographs of the finished physical deck. The current deck images are mockups.
- **LONELY: GOLDEN SUN**: the approved concept image (full resolution).
- **SHADES OF**: the original design files for the six colour studies. The current visuals are small crops from the collection board.
- **BLACK & GOLD**: the approved original design file.
- **JUSTICE / JUSTICE (Vinyl Edition)**: written image-rights confirmation from Andre Pfeifer, or an authorised alternative image.
- **AURA 001**: the prototype startup video, authentic prototype photographs, and any further approved concept images.
- **Archive**: sketches, material-test photos, unfinished ideas and written reflections on creative accidents.
- **About**: a short biography in your own words, if wanted.
- Confirmed **dimensions** for every work. All currently show "TBC".

## Open questions for the artist (inconsistencies in the supplied material)

These have **not** been resolved on the site. They're flagged here for you to decide.
- **JUSTICE format**: the collection boards show **nine decks (3 × 3)**, but the separate JUSTICE board shows a **six-deck canvas (3 × 2, approx. 75 × 162 cm)** with vinyl print plus acrylic spray paint. The site currently describes the 3 × 3 version, following the collection boards and brief.
- **SHADES OF medium**: the collection boards say **acrylic on Canadian maple decks (or printed)**. The brief calls it **digital artwork development** with smooth colour fields. A separate board shows **"15 Shades of Green" in rhinestones**, which the site lists as a **separate related work**, pending your confirmation.
- **LONELY: GOLDEN SUN title**: the boards use "LONELY: GOLDEN SUN" and the brief uses "LONELY — GOLDEN SUN". The site follows the boards.
- **LONELY medium wording** varies slightly between boards ("Photographic print on Canadian maple skateboard deck" / "Photography & vinyl on skateboard deck").

---

## Testing

`tests/e2e.mjs` runs headless Chrome (Playwright) against a built copy of the site, on desktop and on iPhone- and Android-sized touch devices. It checks the intro and skip, navigation, filters, artwork pages and metadata, gallery walking and collisions, doorways, click-to-walk, drag to look, room transitions, opening works, the enlarged view, guided mode, the AURA simulation, the 2D view, the WebGL fallback, reduced motion, sound, the contact behaviour, the touch joystick and console errors.

```bash
npx serve out -l 8091   # or any static server
node tests/e2e.mjs http://127.0.0.1:8091 local
```
