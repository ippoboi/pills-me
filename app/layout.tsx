import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Providers from "./providers";
import { AuthProvider } from "@/lib/contexts/auth-context";
import {
  validateEnvironmentVariables,
  isServerEnvironment,
} from "@/lib/env-validation";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Validate environment variables on server startup
if (isServerEnvironment()) {
  validateEnvironmentVariables();
}

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Pillker",
  description: "Pillker is a platform for tracking your supplements.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pillker",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f4f6",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} bg-gray-100 antialiased`}>
        <Providers>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <SpeedInsights />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
