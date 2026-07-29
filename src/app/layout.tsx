import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrestamosLeoWEB - Gestión de Préstamos al 20%",
  description: "Sistema de control de cobranzas, diario, semanal y quincenal para negocios de préstamos.",
  keywords: ["prestamos", "cobranzas", "gestion de prestamos", "ruta diaria", "20 por ciento"],
  authors: [{ name: "PrestamosLeoWEB" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAF8F5",
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
