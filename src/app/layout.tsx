import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import InstallAppModal from "@/components/InstallAppModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://imperiobarber.com"),
  title: "Imperio Barber | El Cerrito, Valle del Cauca",
  description: "Barbería premium en El Cerrito. Reserva tu turno online en segundos, conoce nuestros servicios, precios en COP y trabajos destacados.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Imperio Barber | El Cerrito, Valle del Cauca",
    description: "Barbería premium en El Cerrito. Reserva tu turno online en segundos, conoce nuestros servicios y tarifas.",
    url: "/",
    siteName: "Imperio Barber",
    images: [
      {
        url: "/portada.png",
        width: 1280,
        height: 720,
        alt: "Imperio Barber - Portada Oficial y Reservas Online",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imperio Barber | El Cerrito",
    description: "Barbería premium en El Cerrito. Reserva tu turno online en segundos.",
    images: ["/portada.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Imperio Barber",
  },
};

export const viewport = {
  themeColor: "#09090b",
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
        <InstallAppModal />
      </body>
    </html>
  );
}
