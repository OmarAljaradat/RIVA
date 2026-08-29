import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://riva-lime.vercel.app'),
  title: {
    default: 'بوتيك ريفا | فساتين سهرة ومناسبات راقية في الأردن',
    template: '%s | بوتيك ريفا RIVA',
  },
  description:
    'تسوقي أحدث وأفخم فساتين السهرة والمناسبات في الأردن من بوتيك ريفا RIVA. كريب باربي، شيفون ملكي، وستان نخب أول مع خدمة التوصيل السريع لكافة محافظات المملكة والدفع عند الاستلام.',
  keywords: [
    'بوتيك ريفا',
    'فساتين ريفا',
    'فساتين سهرة الأردن',
    'فساتين سهرة عمان',
    'فساتين مناسبات فخمة',
    'متجر فساتين نسائية',
    'فساتين خطوبة وملكة الأردن',
    'فساتين كريب باربي',
    'فساتين شيفون مبطن',
    'فساتين ستان فاخرة',
    'توصيل فساتين عمان والأردن',
    'RIVA Boutique Jordan',
  ],
  authors: [{ name: 'RIVA Boutique' }],
  creator: 'RIVA Boutique',
  publisher: 'RIVA Boutique',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://riva-lime.vercel.app',
  },
  openGraph: {
    title: 'بوتيك ريفا | فساتين سهرة ومناسبات راقية في الأردن',
    description:
      'تشكيلة راقية ومميزة من فساتين السهرة والمناسبات في الأردن بأعلى جودة وأفضل الأسعار مع توصيل فوري لكافة المحافظات ودفع عند الاستلام.',
    url: 'https://riva-lime.vercel.app',
    siteName: 'بوتيك ريفا - RIVA',
    locale: 'ar_JO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بوتيك ريفا | فساتين سهرة ومناسبات راقية في الأردن',
    description:
      'أحدث صيحات فساتين السهرة والمناسبات الفاخرة في الأردن مع توصيل فوري ودفع عند الاستلام.',
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
  verification: {
    google: '2m9hSJAekyGkkmiXe5FNOsMnVEr5N48mIZ4',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'بوتيك ريفا | RIVA Boutique',
  alternateName: 'RIVA Dresses Jordan',
  description:
    'بوتيك ريفا المتخصص في أرقى فساتين السهرة والمناسبات النسائية في الأردن. أقمشة فاخرة، مقاسات متنوعة، وخدمة توصيل فورية لكافة المحافظات.',
  url: 'https://riva-lime.vercel.app',
  priceRange: '20 JOD - 60 JOD',
  currenciesAccepted: 'JOD',
  paymentAccepted: 'Cash on Delivery, CliQ',
  areaServed: {
    '@type': 'Country',
    name: 'Jordan',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Amman',
    addressCountry: 'JO',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://riva-lime.vercel.app/products?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="google-site-verification" content="2m9hSJAekyGkkmiXe5FNOsMnVEr5N48mIZ4" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@dawod/thmanyah-font-web/index.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

