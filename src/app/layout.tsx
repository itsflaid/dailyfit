import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./globals.css";
import "aos/dist/aos.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});



export const metadata: Metadata = {
  title: "DailyFit — Stay Strong",
  description: "Tracker latihan harian pribadi",
  icons: {
    icon: "/logo-trans.png",
  },
  // manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DailyFit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">

      <body className={`${barlowCondensed.variable} ${dmSans.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
