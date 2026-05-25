import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoriaStudy",
  description: "Collaborative AI-powered study decks from PDFs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
