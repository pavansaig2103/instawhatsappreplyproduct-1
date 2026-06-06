import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstaReply AI",
  description: "Multi-business lead capture assistant MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
