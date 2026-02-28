import type { Metadata } from "next";
import "./globals.css";
import { getThemeCSS } from "@/lib/theme";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "CRRT — Club Robotique & Recherche Technologique",
  description:
    "Club Robotique & Recherche Technologique, ENSA Agadir. Trainings, competitions, and research in robotics, AI, and embedded systems.",
  keywords: ["CRRT", "robotique", "ENSA Agadir", "robotics club", "Arduino", "AI"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCSS = await getThemeCSS();

  return (
    <html lang="fr" className="dark">
      <head>
        {themeCSS && (
          <style
            id="crrt-theme"
            dangerouslySetInnerHTML={{ __html: themeCSS }}
          />
        )}
      </head>
      <body className="antialiased gradient-wash noise-overlay min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

