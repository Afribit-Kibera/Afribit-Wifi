import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./mesh-flow.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Mesh — Good things connect", template: "%s | Mesh" },
  description: "Community Wi-Fi by Afribit. Buy an internet pass with M-Pesa or Bitcoin. Signal, Blink and Bitcoin lessons are free.",
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
