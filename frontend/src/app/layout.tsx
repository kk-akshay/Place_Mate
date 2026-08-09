import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "AI Placement Preparation Platform",
  description:
    "AI-powered placement preparation for students.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}