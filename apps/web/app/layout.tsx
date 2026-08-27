import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Betaal",
  description: "A Socratic cultural interlocutor for books, films, and ideas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
