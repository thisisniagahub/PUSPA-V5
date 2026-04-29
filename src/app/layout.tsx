import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PUSPA — Sistem Pengurusan NGO",
  description: "Sistem Pengurusan Pertubuhan Urus Peduli Asnaf (PUSPA) KL & Selangor — Platform terpusat untuk pengurusan asnaf, program kebajikan, sumbangan, dan pematuhan regulasi.",
  keywords: ["PUSPA", "NGO", "asnaf", "zakat", "kebajikan", "Malaysia", "pengurusan"],
  authors: [{ name: "PUSPA" }],
  icons: {
    icon: "/puspa-logo-official.png",
    apple: "/puspa-logo-official.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${manrope.variable} font-sans antialiased bg-background text-foreground relative min-h-screen`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
