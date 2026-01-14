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

export const metadata: Metadata = {
  title: "表态 BiaoTai - AI手表鉴定专家",
  description: "犀利点评，精准估价，让您的手表「表态」",
  icons: {
    icon: [
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/logo.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '表态 BiaoTai'
  },
  openGraph: {
    title: '表态 BiaoTai - AI手表鉴定专家',
    description: '犀利点评，精准估价，让您的手表「表态」',
    images: ['/logo.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: '表态 BiaoTai - AI手表鉴定专家',
    description: '犀利点评，精准估价，让您的手表「表态」',
    images: ['/logo.png']
  },
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
