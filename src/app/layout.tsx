import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import FloatingWhatsAppButton from "@/components/common/FloatingWhatsAppButton";
import CartSync from "@/components/common/CartSync";
import { Toaster } from "@/components/ui/sonner";
import NavigationHistory from "@/components/common/NavigationHistory";
import StaleBuildRecovery from "@/components/common/StaleBuildRecovery";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alisan",
  description: "",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <StaleBuildRecovery />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col bg-gray-50/50`}
      >
        <CartSync />
        <NavigationHistory />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingWhatsAppButton />
        <Toaster
          position="top-center"
          offset={{ top: 84 }}
          mobileOffset={{ top: 68, left: 12, right: 12 }}
        />
      </body>
    </html>
  );
}
