import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://riva-lime.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
