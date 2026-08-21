"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin: boolean;
}

interface NavItem {
  href: string;
  label: string;
  children?: NavItem[];
}

const GUEST_NAV_ITEMS: NavItem[] = [{ href: "/", label: "Accueil" }];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/status", label: "Status" },
  { href: "/admin/sources", label: "Source" },
  {
    href: "/admin/tags",
    label: "Tags",
    children: [
      { href: "/admin/tags/duplicates", label: "Doublons" },
      { href: "/admin/tags/marketplace", label: "Tags Marketplace" },
    ],
  },
  { href: "/admin/scheduled", label: "Scheduled" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/settings", label: "Parametres" },
];

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : GUEST_NAV_ITEMS;
  const homeHref = isAdmin ? "/admin" : "/";

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <nav className="flex w-64 shrink-0 flex-col gap-1 bg-sidebar p-5 text-sidebar-foreground">
      <Link href={homeHref} className="mb-6 flex items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="h-8 w-8" />
        <span className="text-lg font-bold">Library3D</span>
      </Link>
      {navItems.map((item) => (
        <div key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80",
            )}
          >
            {item.label}
          </Link>

          {item.children && (
            <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-sidebar-accent pl-3">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive(child.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60",
                  )}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
