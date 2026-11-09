import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recode Terminal — Autonomous AI Coding Agent",
  description: "Next-generation autonomous software engineering terminal and SDK.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-term-bg text-gray-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
