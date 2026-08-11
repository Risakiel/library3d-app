import Link from "next/link";

interface SidebarProps {
  isAdmin: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const navItems = isAdmin
    ? [{ href: "/admin", label: "Administration" }]
    : [{ href: "/", label: "Accueil" }];
  const homeHref = isAdmin ? "/admin" : "/";

  return (
    <nav className="flex w-64 shrink-0 flex-col gap-1 bg-sidebar p-5 text-sidebar-foreground">
      <Link href={homeHref} className="mb-6 flex items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="h-8 w-8" />
        <span className="text-lg font-bold">Library3D</span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
