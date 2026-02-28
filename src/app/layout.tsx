import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/providers/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lomash Wood Admin",
    template: "%s | Lomash Wood Admin",
  },
  description: "Admin dashboard for Lomash Wood — kitchen and bedroom design management.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}