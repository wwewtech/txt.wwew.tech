import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://txt.wwew.tech"),
  title: {
    default: "txt.wwew.tech",
    template: "%s · txt.wwew.tech",
  },
  description:
    "Local-first инструмент для конвертации файлов и папок в единый LLM-ready контекст без серверной обработки.",
  applicationName: "txt.wwew.tech",
  keywords: [
    "LLM context",
    "context builder",
    "local-first",
    "Next.js",
    "txt converter",
    "prompt engineering",
    "RAG",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "txt.wwew.tech",
    title: "txt.wwew.tech",
    description:
      "Собери единый контекст для LLM из файлов, папок и архивов локально в браузере.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "txt.wwew.tech",
      },
    ],
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "txt.wwew.tech",
    description:
      "Local-first конвертер файлов в LLM-ready контекст без отправки данных на сервер.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon-32x32.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
