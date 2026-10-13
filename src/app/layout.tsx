import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imperio Barber | El Cerrito, Valle del Cauca",
  description: "Barbería premium en El Cerrito. Reserva tu turno online en segundos, conoce nuestros servicios, precios en COP y trabajos destacados.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#18181b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-amber-500/30">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
