// src/components/JsonLd.tsx
import React from 'react';

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    "name": "Conceptra",
    "legalName": "Conceptra Financial & Corporate Advisory Desk",
    "description": "Premium Chartered Accountancy, Corporate Auditing, and GST Taxation advisory firm based in Gurugram.",
    "url": "https://conceptra.co.in",
    "telephone": "+91-XXXXXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sector 45",
      "addressLocality": "Gurugram",
      "addressRegion": "Haryana",
      "postalCode": "122003",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "28.4595",
      "longitude": "77.0266"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:30",
      "closes": "18:30"
    },
    "sameAs": [
      "https://www.linkedin.com/company/conceptra-india"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}