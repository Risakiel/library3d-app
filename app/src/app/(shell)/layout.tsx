import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}
