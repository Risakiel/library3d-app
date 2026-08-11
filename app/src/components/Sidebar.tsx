import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/admin", label: "Administration" },
];

export function Sidebar() {
  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        minHeight: "100vh",
        borderRight: "1px solid #262626",
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <span style={{ fontWeight: 700, fontSize: "1.1rem", padding: "0 0.5rem 1rem" }}>Library3D</span>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 6,
            color: "#f0f0f0",
            textDecoration: "none",
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
