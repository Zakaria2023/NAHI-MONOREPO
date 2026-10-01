import { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

// Self-hosted at build time: no request to a font host from the browser.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NAHI — Admin",
  description: "Mobily and STC project workflows, procurement, warehouse, custody and finance",
};

// Always render against the live store — never a build-time snapshot.
export const dynamic = "force-dynamic";

const RootLayout = ({ children }: Props) => (
  <html lang="en" className={`h-full antialiased ${inter.variable}`}>
    <body className="flex min-h-full flex-col font-sans text-ink">{children}</body>
  </html>
);

export default RootLayout;
