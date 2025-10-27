// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import { AuthProvider } from "@/app/components/AuthProvider"; // Import AuthProvider

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
            className={`flex flex-col min-h-screen w-full bg-gray-50 ${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {/* Bọc toàn bộ ứng dụng trong AuthProvider */}
        <AuthProvider>
            <Navbar />
            <main className="flex-1 container mx-auto py-8">
                {children}
            </main>
            <Footer />
        </AuthProvider>
        </body>
        </html>
    );
}