import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/connect", label: "Connect" },
  { href: "/compose", label: "Compose" },
  { href: "/jobs", label: "Jobs" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" }
];

export function NavBar() {
  return (
    <nav className="flex gap-4 border-b border-zinc-800 px-6 py-4 text-sm">
      <span className="font-semibold text-zinc-100">TikTok Publishing Console</span>
      <div className="flex gap-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-zinc-400 hover:text-zinc-100">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
