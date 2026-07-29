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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased selection:bg-[#E89D4F]/30">
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#2C221E]">
        {children}
      </body>
    </html>
  );
}
