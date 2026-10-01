import { Metadata } from "next";
import { Geist } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

// Self-hosted at build time: no request to a font host from the browser.
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NAHI — Admin",
  description: "Mobily and STC project workflows, procurement, warehouse, custody and finance",
};

// Always render against the live store — never a build-time snapshot.
export const dynamic = "force-dynamic";

const RootLayout = ({ children }: Props) => (
  <html lang="en" className={`h-full antialiased ${geist.variable}`}>
    <body className="flex min-h-full flex-col font-sans text-ink">{children}</body>
  </html>
);

export default RootLayout;
