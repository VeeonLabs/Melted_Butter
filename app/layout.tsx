import type { Metadata, Viewport } from "next";
import { Bangers, Caprasimo, Caveat, Cinzel, Cormorant_Garamond, DM_Serif_Display, Figtree, Permanent_Marker, Syne } from "next/font/google";
import "./globals.css";

// Body + the flagship's display face preload; the other theme faces load on first use.
const body = Figtree({ subsets: ["latin"], variable: "--font-body-face", display: "swap" });
const elegant = Cormorant_Garamond({ weight: ["600", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-elegant-face", display: "swap" });
const editorial = DM_Serif_Display({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-editorial-face", display: "swap", preload: false });
const storybook = Cinzel({ weight: ["600", "700"], subsets: ["latin"], variable: "--font-storybook-face", display: "swap", preload: false });
const modern = Syne({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-modern-face", display: "swap", preload: false });
const comic = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-comic-face", display: "swap", preload: false });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker-face", display: "swap", preload: false });
const hand = Caveat({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-hand-face", display: "swap", preload: false });
const cute = Caprasimo({ weight: "400", subsets: ["latin"], variable: "--font-cute-face", display: "swap", preload: false });

const fontVars = [body, elegant, editorial, storybook, modern, comic, marker, hand, cute].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "Melted Butter",
  description: "A little universe made for two.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f0e8",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVars}>
      <body className="min-h-dvh font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
