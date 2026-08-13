import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: { default: 'Tengok Tetangga', template: '%s | Tengok Tetangga' },
  description: 'Platform pelaporan dan manajemen kasus sosial berbasis komunitas untuk mewujudkan kepedulian nyata antar warga Kota Bontang.',
  keywords: ['tengok tetangga', 'laporan sosial', 'kemiskinan', 'bantuan sosial', 'OPD', 'Bontang'],
  authors: [{ name: 'Dinas Kominfo Kota Bontang' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tengok Tetangga',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Tengok Tetangga — Kota Bontang',
    description: 'Platform pelaporan kasus sosial berbasis komunitas',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Tengok Tetangga',
  },
  twitter: {
    card: 'summary',
    title: 'Tengok Tetangga',
    description: 'Platform pelaporan kasus sosial berbasis komunitas Kota Bontang',
  },
  icons: {
    icon: [
      { url: '/favicon.png',           type: 'image/png' },
      { url: '/favicon.ico',           sizes: 'any' },
      { url: '/icons/icon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/icon-192x192.png',sizes: '192x192',type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Favicon — PNG untuk browser modern, ICO sebagai fallback */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32"  href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96"  href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#FFC200" />
        {/* Cegah flash dark/light saat load pertama */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('tt_theme') || 'light';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              },
              success: { iconTheme: { primary: '#22C55E', secondary: '#F9FAFB' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' } },
            }}
          />
          <ServiceWorkerRegistrar />
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
