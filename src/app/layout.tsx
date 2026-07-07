import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import FloatingWhatsAppButton from "@/components/common/FloatingWhatsAppButton";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alisan | Spesialis Sablon Cup Plastik",
  description: "Pusat penyedia dan jasa sablon cup plastik profesional. Kami hadir untuk membantu membranding kemasan bisnis minuman Anda dengan kualitas sablon terbaik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col bg-gray-50/50`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingWhatsAppButton />
        <div className="hidden md:block">
          <Toaster position="top-center" />
        </div>
      </body>
    </html>
  );
}
