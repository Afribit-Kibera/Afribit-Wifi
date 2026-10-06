import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./mesh-portal.css";
import "./mesh-flow.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Mesh — Good things connect", template: "%s | Mesh" },
  description: "A community network by Afribit. Discover local services, explore free apps, and choose an internet pass paid with Bitcoin.",
};

export const viewport: Viewport = { themeColor: "#f4f1e9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>
        {children}
        <Toaster theme="light" richColors position="top-center" />
      </body>
    </html>
  );
}
