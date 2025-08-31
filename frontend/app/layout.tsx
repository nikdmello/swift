import './globals.css'
import { Providers } from '@/app/providers'
import { Nav } from '@/components/Nav'
import '@rainbow-me/rainbowkit/styles.css'

export const metadata = {
  title: 'Swift Protocol',
  description: 'Agent-to-agent messaging + streaming',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
