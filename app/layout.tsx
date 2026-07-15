import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ta Hora",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#000000" }}>{children}</body>
    </html>
  )
}
