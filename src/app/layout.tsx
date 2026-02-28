import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRRT — Club Robotique & Recherche Technologique",
  description:
    "Club Robotique & Recherche Technologique, ENSA Agadir. Trainings, competitions, and research in robotics, AI, and embedded systems.",
  keywords: ["CRRT", "robotique", "ENSA Agadir", "robotics club", "Arduino", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased gradient-wash noise-overlay min-h-screen">
        {children}
      </body>
    </html>
  );
}
