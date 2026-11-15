import type { Metadata } from "next";
import { PLATFORM_NAME, PLATFORM_SUBTITLE } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: PLATFORM_NAME, template: `%s | ${PLATFORM_NAME}` },
  description: PLATFORM_SUBTITLE,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
