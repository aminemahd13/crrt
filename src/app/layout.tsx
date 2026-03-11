import type { Metadata } from "next";
import "./globals.css";
import { getThemeCSS } from "@/lib/theme";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "CRRT - Club Robotique & Recherche Technologique",
  description:
    "Club Robotique & Recherche Technologique, ENSA Agadir. Trainings, competitions, and research in robotics, AI, and embedded systems.",
  keywords: [
    "CRRT",
    "robotique",
    "ENSA Agadir",
    "robotics club",
    "Arduino",
    "AI",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCSS = await getThemeCSS();

  return (
    <html lang="en" className="dark">
      <head>
        {themeCSS ? (
          <style id="crrt-theme" dangerouslySetInnerHTML={{ __html: themeCSS }} />
        ) : null}
      </head>
      <body className="antialiased gradient-wash noise-overlay min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-midnight-light focus:px-3 focus:py-2 focus:text-ice-white focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
