"use client";
import { useEffect, useState } from "react";
import type { Artwork } from "@/lib/types";

export default function WorksCatalogue({ filters, works, cards }: { filters: { id: string; label: string }[]; works: Pick<Artwork, "slug" | "categories">[]; cards: Record<string, React.ReactNode> }) {
  const [active, setActive] = useState("all");
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("filter");
    if (f && filters.some((x) => x.id === f)) setActive(f);
  }, [filters]);
  const select = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("filter"); else url.searchParams.set("filter", id);
    window.history.replaceState(null, "", url);
  };
  const shown = works.filter((w) => active === "all" || w.categories.includes(active));
  return (
    <>
      <div role="group" aria-label="Filter works by category" className="flex flex-wrap gap-2 mb-14">
        {filters.map((f) => (
          <button key={f.id} onClick={() => select(f.id)} aria-pressed={active === f.id} data-testid={`filter-${f.id}`}
            className={`px-4 py-2 text-[0.78rem] tracking-[0.12em] uppercase border transition-colors ${active === f.id ? "bg-forest text-titanium border-forest" : "border-charcoal/20 hover:border-charcoal/60"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{shown.length} works shown</p>
      {shown.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-charcoal/20" data-testid="empty-filter">
          <p className="font-display text-3xl">Nothing here yet.</p>
          <p className="mt-3 text-stone">No works are currently catalogued in this category.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20" data-testid="works-grid">
          {shown.map((w) => <div key={w.slug}>{cards[w.slug]}</div>)}
        </div>
      )}
    </>
  );
}
