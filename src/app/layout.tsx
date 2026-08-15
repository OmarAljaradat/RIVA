import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Riva | متجر فساتين راقية',
  description: 'متجر ريفا لبيع الفساتين النسائية الراقية في الأردن. تشكيلة واسعة من أحدث الموديلات.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@dawod/thmanyah-font-web/index.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
