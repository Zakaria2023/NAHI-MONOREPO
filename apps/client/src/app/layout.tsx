import { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: "NAHI — Client",
  description: "Client app — reserved for a later phase",
};

const RootLayout = ({ children }: Props) => (
  <html lang="en" className="h-full antialiased">
    <body className="flex min-h-full flex-col font-sans text-ink">{children}</body>
  </html>
);

export default RootLayout;
