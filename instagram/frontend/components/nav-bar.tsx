import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/compose", label: "Compose" },
  { href: "/jobs", label: "Jobs" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" }
];

export function NavBar() {
  return (
    <header className="border-b border-[var(--ig-border)] bg-[var(--ig-surface)]">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <span className="font-semibold text-[var(--ig-accent)]">Instagram Console</span>
        <div className="flex gap-4 text-sm text-[var(--ig-muted)]">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[var(--ig-text)]">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
