import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";

import { LayoutChrome } from "@/components/layout-chrome";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-headline",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GadgetWizard",
  description: "Technology-focused ecommerce storefront and dashboard platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolageGrotesque.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LayoutChrome>{children}</LayoutChrome>
        <Toaster />
      </body>
    </html>
  );
}
