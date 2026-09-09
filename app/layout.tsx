import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Умный ученик — Студия решений",
  description: "Интерактивная образовательная платформа для 4–5 классов",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
