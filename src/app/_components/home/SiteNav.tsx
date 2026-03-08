import Link from "next/link";

const links = [
  { label: "Preview", href: "/preview" },
  { label: "Artifacts", href: "/artifacts" },
  { label: "Logbook", href: "/logbook" },
  { label: "Events", href: "/events" },
  { label: "Connect", href: "/connect" },
];

export default function SiteNav() {
  return (
    <div className="flex items-center gap-6">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
