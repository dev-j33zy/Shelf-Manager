import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SettingsProvider } from "@/components/SettingsProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ShelfManager | Inventory System",
  description: "Advanced equipment tracking and management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full transition-colors">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900`}>
        <SettingsProvider>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
