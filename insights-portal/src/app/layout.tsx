import type { Metadata } from "next";
import { IBM_Plex_Mono, Spline_Sans } from "next/font/google";

import { SiteNavigation } from "@/components/site-navigation";

import "./globals.css";
import { Providers } from "./providers";

const spline = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-spline",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Housing Insights",
    template: "%s · Housing Insights",
  },
  description:
    "Property estimation and housing market analysis in one measured workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spline.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <div className="app-shell">
            <SiteNavigation />
            <main className="page-canvas">
              <div className="page-frame">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
