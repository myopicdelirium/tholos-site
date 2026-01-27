import Link from "next/link";

const links = [
  ["About", "/about"],
  ["Preview", "/preview"],
  ["Artifacts", "/artifacts"],
  ["Logbook", "/logbook"],
  ["Events", "/events"],
  ["Connect", "/connect"],
] as const;

export default function Nav() {
  return (
    <div className="w-full border-b rule">
      <div className="mx-auto w-full max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="md-display text-xl tracking-tight">
          Tholos.
        </Link>
        <div className="flex items-center gap-6">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
