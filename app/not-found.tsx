import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-40 text-center">
      <p className="eyebrow text-gallery">An accidental error</p>
      <h1 className="font-display text-6xl mt-4">This page does not exist.</h1>
      <Link href="/" className="link-underline mt-10 inline-block eyebrow">Return home</Link>
    </div>
  );
}
