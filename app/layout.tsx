import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { SITE_URL } from "@/lib/config";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif-face", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "MINDED: The Saboteur and Curator of Accidental Errors", template: "%s | MINDED" },
  description: "MINDED is the contemporary artistic identity of Dammy Ojo: photography, mixed media, sculptural objects, interactive technology, digital experiences and writing.",
  openGraph: { siteName: "MINDED", type: "website" },
};

export const viewport: Viewport = { themeColor: "#103D2C" };

// Hides the intro before first paint for visitors who have already seen it.
const introScript = `try{if(sessionStorage.getItem('minded-intro-seen')==='1')document.documentElement.dataset.introSeen='1'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] bg-forest text-titanium px-4 py-2">Skip to content</a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
