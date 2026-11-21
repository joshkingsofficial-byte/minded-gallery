/**
 * Content data layer.
 *
 * Every page and the 3D gallery read content through these functions only.
 * Today they read the JSON files in /content. In Phase 3 they can be swapped
 * for a CMS client (e.g. Sanity GROQ queries or Payload's local API) without
 * touching any component: keep the same return types.
 */
import artworksData from "@/content/artworks.json";
import exhibitionsData from "@/content/exhibitions.json";
import archiveData from "@/content/archive.json";
import siteData from "@/content/site.json";
import literatureData from "@/content/literature.json";
import auraData from "@/content/aura.json";
import { justiceImagesCleared } from "./config";
import type { Artwork, ArchiveSection, Exhibition, Room, ArtworkImage } from "./types";

function visibleImages(images: ArtworkImage[] | undefined): ArtworkImage[] {
  return (images || []).filter((i) => !(i.restricted === "justice" && !justiceImagesCleared));
}

function normalise(a: Artwork): Artwork {
  return { ...a, images: visibleImages(a.images), process: visibleImages(a.process) };
}

const all: Artwork[] = (artworksData.artworks as unknown as Artwork[])
  .filter((a) => a.published)
  .map(normalise)
  .sort((a, b) => a.order - b.order);

/** Top-level catalogue entries (series children are excluded). */
export function getArtworks(): Artwork[] {
  return all.filter((a) => !a.parent);
}

/** Every published artwork, including series children. */
export function getAllArtworks(): Artwork[] {
  return all;
}

export function getArtwork(slug: string): Artwork | undefined {
  return all.find((a) => a.slug === slug);
}

export function getSeries(a: Artwork): Artwork[] {
  return (a.series || []).map((s) => getArtwork(s)).filter(Boolean) as Artwork[];
}

/** Whether images for this work are withheld (e.g. pending rights). */
export function imagesWithheld(a: Artwork): boolean {
  return !!a.rightsPending && !justiceImagesCleared;
}

export function getExhibition(): Exhibition {
  return exhibitionsData.exhibition;
}

export function getRooms(): Room[] {
  return exhibitionsData.rooms as Room[];
}

export function getArchive(): { intro: string; sections: ArchiveSection[] } {
  return archiveData as unknown as { intro: string; sections: ArchiveSection[] };
}

export const site = siteData;
export const literature = literatureData;
export const aura = auraData;
