import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Preceto',
  description:
    'Experience the next evolution of interaction. Preceto refines, optimizes, and scales your prompts for LLMs with surgical precision. Powered by HIM™ (Hybrid Entity Intelligence Model) for elite MLOps performance.',
  generator: 'Preceto',
  applicationName: 'Preceto',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'David C Cavalcante', url: 'https://preceto.vercel.app' }],
  creator: 'David C Cavalcante',
  publisher: 'David C Cavalcante',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  keywords: [
    'Preceto',
    'David C Cavalcante',
    'Massive Artificial Intelligence Consciousness',
    'MAIC',
    'HIM',
    'Hybrid Entity Intelligence Model',
    'NHE',
    'Non-human Entity',
    'Noumenal Higher-order Entity',
    'AI Model Tuning',
    'Automated Prompt Refinement',
    'Generative AI',
    'Large Language Models',
    'LLM',
    'LLM Optimization',
    'LLMO',
    'LLMOps',
    'Machine Learning Operations',
    'ML',
    'MLO',
    'MLOps',
    'Prompt Engineering',
  ],
  openGraph: {
    title: 'Preceto — Advanced Prompt Engineering & LLM Optimization',
    description:
      'Experience the next evolution of interaction. Preceto refines, optimizes, and scales your prompts for LLMs with surgical precision.',
    url: 'https://preceto.vercel.app',
    siteName: 'Preceto',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preceto — Advanced Prompt Engineering & LLM Optimization',
    description:
      'Experience the next evolution of interaction. Preceto refines, optimizes, and scales your prompts for LLMs with surgical precision.',
    creator: '@preceto',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    'content': 'Preceto is a prompt engineering tool that optimizes, refines, improves and creates prompts for LLMs using advanced prompt engineering techniques. Structured with HIM™ (Hybrid Entity Intelligence Model) created by David C Cavalcante.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? process.env.GTM_ID
const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Preceto</title>
        {adsensePublisherId ? (
          <>
            <meta name="google-adsense-account" content={adsensePublisherId} />
            <Script
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
          </>
        ) : null}
        {gtmId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gtmId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gtmId}');`}
            </Script>
          </>
        ) : null}
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
