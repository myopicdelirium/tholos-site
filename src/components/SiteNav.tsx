import Link from "next/link";

const links = [
  { href: "/about", label: "ABOUT" },
  { href: "/preview", label: "PREVIEW" },
  { href: "/artifacts", label: "ARTIFACTS" },
  { href: "/logbook", label: "LOGBOOK" },
  { href: "/events", label: "EVENTS" },
  { href: "/connect", label: "CONNECT" },
];

export default function SiteNav() {
  return (
    <header className="w-full border-b rule bg-[rgb(var(--ivory))]">
      <div className="mx-auto w-full max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="md-display text-xl tracking-tight">
          Tholos.
        </Link>

        <nav className="flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
