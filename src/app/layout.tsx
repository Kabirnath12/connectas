import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollabX — Everything connects.",
  description: "Discover people, businesses, opportunities, services and more with CollabX.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}
