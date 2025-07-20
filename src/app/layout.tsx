import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next"
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeetAI",
  description: "MeetAI is a platform for creating and managing your meetings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
    <TRPCReactProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <Toaster />
          {children}
          </body>
      </html>
    </TRPCReactProvider>
    </NuqsAdapter>
  );
}
