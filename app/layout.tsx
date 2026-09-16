import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const daciaBlock = localFont({
  src: [
    { path: "../public/fonts/DaciaBlock-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/DaciaBlock-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-dacia-block",
  fallback: ["Courier New", "Courier", "monospace"],
});

const daciaRead = localFont({
  src: [
    { path: "../public/fonts/Read-Regular_V3000.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Read-Bold_V3000.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-dacia-read",
  fallback: ["Courier New", "Courier", "monospace"],
});

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://standarde-digitale.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Standarde digitale Dacia — verificare website 2026",
    template: "%s · Standarde digitale",
  },
  description:
    "Verificați dacă site-ul Dacia trece grila de website 2026. Raport cu dovezi, de trimis mai departe.",
  icons: {
    icon: [{ url: "/dacia-symbol.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/dacia-symbol.png", sizes: "180x180" }],
  },
  other: { "theme-color": "#646B52" },
  openGraph: {
    title: "Standarde digitale Dacia — verificare website 2026",
    description: "Raport independent pe grila de website. Ce cade, ce trece, ce trebuie schimbat.",
    type: "website",
    locale: "ro_RO",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${daciaBlock.variable} ${daciaRead.variable}`}>
      <body className="flex min-h-full flex-col bg-white font-read text-ink antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
