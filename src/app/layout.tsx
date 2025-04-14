import type { Metadata } from "next";
import { Noto_Sans_Lao, Geist_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import ConvexClientProvider from "./providers";

const notoSansLao = Noto_Sans_Lao({
  weight: ['400', '500', '700'],
  variable: "--font-noto-sans-lao",
  subsets: ["lao"],
});

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lao AI Record",
  description: "ແອັບບັນທຶກສຽງແລະການຖອດຄວາມດ້ວຍ AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="lo" suppressHydrationWarning>
        <body
          className={`${notoSansLao.variable} ${inter.variable} ${geistMono.variable} antialiased font-sans`}
          suppressHydrationWarning
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
