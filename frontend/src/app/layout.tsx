import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATLANIA // Observatorio Planetario & Atlas de Análogos Espaciales",
  description:
    "Atlas y observatorio planetario para explorar territorios terrestres extraordinarios y sus analogías con la Luna y Marte mediante teledetección satelital e índice de similitud ASI.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className="h-full antialiased dark font-sans"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Playfair+Display:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        <link rel="preconnect" href="https://services.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://s3.amazonaws.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://gibs.earthdata.nasa.gov" />
        <link rel="preload" href="/fonts/HelloParis.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/nasa/earth-equirectangular.jpg" as="image" fetchPriority="high" />
        <link rel="preload" href="/nasa/moon-equirectangular.jpg" as="image" />
        <link rel="preload" href="/nasa/mars-equirectangular.jpg" as="image" />
      </head>
      <body className="min-h-full flex flex-col bg-[#101321] text-[#E4DFD5] selection:bg-[#C5A36D]/30 selection:text-[#E4DFD5]">
        {children}
      </body>
    </html>
  );
}
