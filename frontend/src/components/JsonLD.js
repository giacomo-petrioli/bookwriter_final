import React from 'react';

const JsonLD = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

// Predefined structured data for different page types
export const BookAppStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "MyBookCrafter AI",
  "url": "https://mybookcrafter.com",
  "description": "AI-powered book writing platform for creating professional books",
  "applicationCategory": "WritingApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": 150
  }
};

export const OrganizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MyBookCrafter AI",
  "url": "https://mybookcrafter.com",
  "logo": "https://mybookcrafter.com/logo.png",
  "sameAs": [
    "https://twitter.com/mybookcrafter",
    "https://facebook.com/mybookcrafter"
  ]
};

export const BreadcrumbStructuredData = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const FAQStructuredData = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const SoftwareApplicationStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MyBookCrafter AI",
  "operatingSystem": "Web Browser",
  "applicationCategory": "WritingApplication",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": 150
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default JsonLD;