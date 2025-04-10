import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AI Vision Analysis - Real-time Computer Vision Platform",
  description: "Experience real-time AI-powered computer vision analysis with our cutting-edge platform. Get instant insights about your surroundings through advanced visual recognition.",
  keywords: "AI Vision, Computer Vision, Real-time Analysis, Machine Learning, Object Detection",
  authors: [{ name: "AI Vision Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1cbbb4" />
      </head>
      <body className={poppins.className}>{children}</body>
    </html>
  );
}

