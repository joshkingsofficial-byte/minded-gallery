export type ImageKind = "visualisation" | "photograph" | "documentation" | "concept" | "placeholder";

export interface ArtworkImage {
  src: string;
  alt: string;
  caption: string;
  kind: ImageKind;
  role?: "deck" | "detail";
  restricted?: "justice";
}

export interface Edition {
  type: string;
  detail?: string;
}

export interface Artwork {
  slug: string;
  title: string;
  year: string;
  collection?: string;
  parent?: string;
  series?: string[];
  categories: string[];
  medium: string;
  mediumNote?: string;
  dimensions: string;
  status: string;
  statusType: "produced" | "development" | "concept";
  statement: string;
  description: string[];
  editions: Edition[];
  credits?: string;
  presentation?: string;
  rightsPending?: boolean;
  rightsNote?: string;
  images: ArtworkImage[];
  process?: ArtworkImage[];
  toSupply?: string[];
  published: boolean;
  order: number;
}

export interface Placement {
  artwork: string;
  wall: "L" | "R" | "B" | "F";
  t?: number;
  x?: number;
  display: "deck-frame" | "deck-set" | "deck-grid-3x3" | "image-frame" | "aura-simulation" | "doc";
  image?: number;
}

export interface Room {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  intro: string;
  placements: Placement[];
}

export interface Exhibition {
  slug: string;
  title: string;
  subtitle: string;
  statement: string;
}

export interface ArchiveEntry {
  title: string;
  src?: string;
  alt?: string;
  caption: string;
  kind: ImageKind;
  related?: string;
}

export interface ArchiveSection {
  id: string;
  title: string;
  entries: ArchiveEntry[];
}
