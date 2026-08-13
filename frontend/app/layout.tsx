import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "단일세포 분석",
  description: "코딩 없이 웹 GUI만으로 단일세포 전사체(scRNA-seq) 데이터를 분석하고 시각화하는 웹 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
