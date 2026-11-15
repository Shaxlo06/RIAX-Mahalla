import type { Metadata } from "next";
import { PLATFORM_NAME, PLATFORM_SUBTITLE } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://riax-mahalla.vercel.app"),
  title: { default: PLATFORM_NAME, template: `%s | ${PLATFORM_NAME}` },
  description: PLATFORM_SUBTITLE,
  applicationName: PLATFORM_NAME,
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: PLATFORM_NAME,
    description: PLATFORM_SUBTITLE,
    siteName: PLATFORM_NAME,
    locale: "uz_UZ",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
