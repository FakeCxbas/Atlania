import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TERR-ANALOG // Planetary Analog Discovery & ASI Telemetry",
  description:
    "Identify and characterize Earth analogs for permanent Moon base locations and Mars exploration sites using open NASA, ESA, CSA, and JAXA datasets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="preconnect" href="https://services.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://s3.amazonaws.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://gibs.earthdata.nasa.gov" />
        <link rel="dns-prefetch" href="https://tiles.openfreemap.org" />
        <link rel="preload" href="/maplibre-gl-worker.mjs" as="script" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#060913] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}
