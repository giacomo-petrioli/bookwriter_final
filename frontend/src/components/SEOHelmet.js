import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHelmet = ({ 
  title = "MyBookCrafter AI - Write Amazing Books with AI", 
  description = "Create professional books effortlessly with AI-powered writing assistance. From outline to final draft, MyBookCrafter AI helps you craft compelling stories and content.",
  keywords = "mybookcrafter, AI book writing, book creation tool, AI writing assistant, automated book writing, book generator, AI content creation, digital book publishing, write books with AI, MyBookCrafter AI",
  url = "https://mybookcrafter.com",
  image = "https://mybookcrafter.com/og-image.jpg",
  type = "website"
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://mybookcrafter.com/#webapp",
        "name": "MyBookCrafter AI",
        "alternateName": "MyBookCrafter",
        "url": "https://mybookcrafter.com",
        "description": description,
        "applicationCategory": "WritingApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "2.1",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "provider": {
          "@type": "Organization",
          "name": "MyBookCrafter AI",
          "url": "https://mybookcrafter.com"
        },
        "featureList": [
          "AI-powered book writing",
          "Automatic outline generation", 
          "Chapter writing assistance",
          "Book export in multiple formats",
          "Professional book templates",
          "Real-time editing",
          "Multi-language support",
          "Credit-based system"
        ],
        "screenshot": "https://mybookcrafter.com/app-screenshot.jpg"
      },
      {
        "@type": "Organization",
        "@id": "https://mybookcrafter.com/#organization",
        "name": "MyBookCrafter AI",
        "url": "https://mybookcrafter.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://mybookcrafter.com/logo.png",
          "width": 512,
          "height": 512
        },
        "sameAs": [
          "https://twitter.com/mybookcrafter",
          "https://facebook.com/mybookcrafter"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Service",
          "url": "https://mybookcrafter.com/contact"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://mybookcrafter.com/#website",
        "url": "https://mybookcrafter.com",
        "name": "MyBookCrafter AI",
        "description": description,
        "publisher": {
          "@id": "https://mybookcrafter.com/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://mybookcrafter.com/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://mybookcrafter.com/#software",
        "name": "MyBookCrafter AI",
        "description": "AI-powered book writing and content creation platform",
        "url": "https://mybookcrafter.com",
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
          "ratingCount": 150,
          "bestRating": "5",
          "worstRating": "1"
        }
      }
    ]
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="MyBookCrafter AI" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta name="twitter:creator" content="@mybookcrafter" />
      <meta name="twitter:site" content="@mybookcrafter" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="author" content="MyBookCrafter AI" />
      <meta name="publisher" content="MyBookCrafter AI" />
      <meta name="application-name" content="MyBookCrafter AI" />
      <meta name="apple-mobile-web-app-title" content="MyBookCrafter AI" />
      <meta name="msapplication-TileColor" content="#1e293b" />
      <meta name="theme-color" content="#1e293b" />
      
      {/* Language and Geographic */}
      <meta name="language" content="English" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Performance and Technical SEO */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Preload critical resources */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* Security Headers */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    </Helmet>
  );
};

export default SEOHelmet;