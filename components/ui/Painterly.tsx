/** Soft organic green forms used behind dark sections. Decorative only. */
export default function Painterly({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const c = variant === "dark"
    ? ["#205C45", "#398565", "#0b2c20"]
    : ["#dfe8e1", "#cfe0d5", "#eef0e8"];
  return (
    <div className="painterly" aria-hidden="true">
      <span style={{ background: c[0], width: "55vw", height: "55vw", left: "-12vw", top: "-18vw" }} />
      <span style={{ background: c[1], width: "38vw", height: "30vw", right: "-6vw", top: "18%", opacity: 0.45 }} />
      <span style={{ background: c[2], width: "60vw", height: "40vw", left: "25%", bottom: "-25vw" }} />
    </div>
  );
}
