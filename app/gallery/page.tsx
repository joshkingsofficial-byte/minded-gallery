import type { Metadata } from "next";
import GalleryApp from "@/components/gallery/GalleryApp";

export const metadata: Metadata = { title: "Virtual Gallery", description: "Walk through MINDED: First Rooms, a virtual exhibition in six spaces. A 2D view is also available." };

export default function GalleryPage() {
  return (
    <>
      <noscript><p className="p-10">The virtual gallery needs JavaScript. You can browse the <a href="../works/">works catalogue</a> instead.</p></noscript>
      <GalleryApp />
    </>
  );
}
