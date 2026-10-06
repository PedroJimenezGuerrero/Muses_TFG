import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muses Game",
  description: "Muses — Juego de mesa digital táctico y mitológico",
  icons: {
    icon: [
      { url: "/assets/astros/sol.png", sizes: "any" },
      { url: "/icon.png", sizes: "any" },
    ],
    shortcut: "/assets/astros/sol.png",
    apple: "/assets/astros/sol.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/assets/astros/sol.png" type="image/png" />
        <link rel="shortcut icon" href="/assets/astros/sol.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/astros/sol.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
