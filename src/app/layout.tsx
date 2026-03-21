import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { he } from "@/lib/i18n-he";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: he.metaTitle,
  description: he.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="ltr" className={`${rubik.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
