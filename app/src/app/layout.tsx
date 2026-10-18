import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Library3D",
  description: "Ma bibliotheque de modeles 3D",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
