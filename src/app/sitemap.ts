import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://riva-lime.vercel.app';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/policies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const dresses = await prisma.dress.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { id: 'desc' },
    });

    const dressPages: MetadataRoute.Sitemap = dresses.map((dress) => ({
      url: `${baseUrl}/products/${dress.id}`,
      lastModified: dress.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...dressPages];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticPages;
  }
}
