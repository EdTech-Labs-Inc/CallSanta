import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Santa is calling!",
  description: "Our real santa will call a number, ask your child or friend about their wishlist and then email it to you!",
};

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-display',
})

const sourceSans = Source_Sans_3({ 
  subsets: ['latin'],
  variable: '--font-body',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  )
}
