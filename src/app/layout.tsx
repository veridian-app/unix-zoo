import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unix Zoo — Gestión de Tareas & Mascotas",
  description: "Plataforma gamificada de gestión de tareas con mascotas virtuales para equipos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
