// src/app/robots.ts
import { MetadataRoute } from 'next';
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://conceptra.co.in/sitemap.xml',
  };
}
