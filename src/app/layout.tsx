import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrestamosLeoWEB - Administracion de Prestamos",
  description: "Sistema de control de cobranzas, prestamos",
  keywords: ["prestamos", "cobranzas", "gestion de prestamos", "ruta diaria", "20 por ciento"],
  authors: [{ name: "PrestamosLeoWEB" }],
  icons: {
    icon: "/Logo_PrestamosLeo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Warm sepia for day mode; warm coffee-dark for night mode
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)",  color: "#1C1917" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
