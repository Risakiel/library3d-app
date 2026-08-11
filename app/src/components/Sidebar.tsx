import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/admin", label: "Administration" },
];

export function Sidebar() {
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border p-4">
      <span className="mb-4 px-2 text-lg font-bold">Library3D</span>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
