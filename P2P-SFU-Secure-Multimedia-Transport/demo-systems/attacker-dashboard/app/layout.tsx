import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Attacker Dashboard - Security Demo',
    description: 'Security attack demonstration dashboard',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    )
}
