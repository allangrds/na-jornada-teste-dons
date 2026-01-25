import type React from "react"
import type { Metadata } from "next"
import { Inter, Merriweather } from "next/font/google"
import { Suspense } from "react"
import { GoogleAnalytics } from '@next/third-parties/google'

import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "./components/header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" })
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"], display: "swap", variable: "--font-merriweather" })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.testedons.najornada.com.br'),
  title: "Na Jornada | Teste de Dons Espirituais",
  description: "Descubra seus dons e talentos para servir na igreja",
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Na Jornada',
    title: 'Na Jornada | Teste de Dons Espirituais',
    description: 'Descubra seus dons e talentos para servir na igreja',
  },
  twitter: {
    card: 'summary',
    title: 'Na Jornada | Teste de Dons Espirituais',
    description: 'Descubra seus dons e talentos para servir na igreja',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${merriweather.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-8BVLD8077L" />
      </body>
    </html>
  )
}
