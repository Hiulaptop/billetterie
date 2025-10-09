import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {Navbar} from "@/app/components/navbar";
import {Footer} from "@/app/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Billetterie",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`flex flex-col h-auto min-h-screen w-full min-w-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <div className={`flex-1 mt-8`}>
            {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
