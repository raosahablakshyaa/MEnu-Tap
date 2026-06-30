import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/providers/toast-provider';

const APP_NAME = 'TapMenu';
const APP_DESCRIPTION = 'Complete Restaurant Operating System — Menus, Orders, POS, Inventory, AI Business Intelligence & more.';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tapmenu.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'TapMenu — Restaurant Operating System', template: '%s | TapMenu' },
  description: APP_DESCRIPTION,
  keywords: ['restaurant management', 'POS system', 'QR menu', 'restaurant OS', 'inventory management', 'restaurant software India'],
  authors: [{ name: 'TapMenu' }],
  creator: 'TapMenu',
  publisher: 'TapMenu',
  applicationName: APP_NAME,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: 'TapMenu — Restaurant Operating System',
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TapMenu Restaurant OS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TapMenu — Restaurant Operating System',
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TapMenu',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description: APP_DESCRIPTION,
  url: APP_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
