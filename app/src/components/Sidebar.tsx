"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface TagOption {
  id: string;
  name: string;
}

interface SidebarProps {
  isAdmin: boolean;
  statuses?: TagOption[];
  marketplaceTags?: TagOption[];
  siteTags?: TagOption[];
  blueTags?: TagOption[];
}

interface NavItem {
  href: string;
  label: string;
  children?: NavItem[];
}

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

const inputClass =
  "w-full rounded-md border border-sidebar-accent bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary";

export function Sidebar({
  isAdmin,
  statuses = [],
  marketplaceTags = [],
  siteTags = [],
  blueTags = [],
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeHref = isAdmin ? "/admin" : "/";

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const selectedMarketplace = new Set(searchParams.getAll("marketplace"));
  const selectedSites = new Set(searchParams.getAll("site"));
  const selectedTags = new Set(searchParams.getAll("tag"));

  return (
    <nav className="flex w-64 shrink-0 flex-col gap-1 overflow-y-auto bg-sidebar p-5 text-sidebar-foreground">
      <Link href={homeHref} className="mb-6 flex items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="h-8 w-8" />
        <span className="text-lg font-bold">Library3D</span>
      </Link>

      {isAdmin &&
        ADMIN_NAV_ITEMS.map((item) => (
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

      {!isAdmin && (
        <form action="/" method="get" className="flex flex-col gap-4">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Rechercher un modele..."
            className={inputClass}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase text-sidebar-foreground/50">Statut</label>
            <select name="statusId" defaultValue={searchParams.get("statusId") ?? ""} className={inputClass}>
              <option value="" className="bg-sidebar text-sidebar-foreground">
                Tous les statuts
              </option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id} className="bg-sidebar text-sidebar-foreground">
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Rechercher
            </button>
            <Link
              href="/"
              className="rounded-md border border-sidebar-accent px-3 py-2 text-center text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
            >
              Reinitialiser
            </Link>
          </div>

          <CheckboxGroup label="Marketplace" name="marketplace" options={marketplaceTags} selected={selectedMarketplace} />
          <CheckboxGroup label="Site" name="site" options={siteTags} selected={selectedSites} />
          <CheckboxGroup label="Tags" name="tag" options={blueTags} selected={selectedTags} />
        </form>
      )}
    </nav>
  );
}

interface CheckboxGroupProps {
  label: string;
  name: string;
  options: TagOption[];
  selected: Set<string>;
}

function CheckboxGroup({ label, name, options, selected }: CheckboxGroupProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 border-t border-sidebar-accent pt-4">
      <span className="text-xs uppercase text-sidebar-foreground/50">{label}</span>
      <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
            <input
              type="checkbox"
              name={name}
              value={option.id}
              defaultChecked={selected.has(option.id)}
              className="h-3.5 w-3.5 shrink-0 rounded border-sidebar-accent"
            />
            <span className="truncate">{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
