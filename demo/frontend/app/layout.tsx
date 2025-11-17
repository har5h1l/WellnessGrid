import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "WellnessGrid Demo",
    description: "Teen health tracking and AI wellness assistant - Demo Version",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    )
}

