// SEO utility functions and constants

export const SEO_CONFIG = {
  siteName: 'MyBookCrafter AI',
  siteUrl: 'https://mybookcrafter.com',
  defaultTitle: 'MyBookCrafter AI - Write Amazing Books with AI | #1 AI Book Writing Platform 2025',
  defaultDescription: '🚀 Create professional books effortlessly with AI-powered writing assistance. From outline to final draft, MyBookCrafter AI helps you craft compelling stories and content. Join 10,000+ writers using the best AI book creation platform!',
  defaultKeywords: 'mybookcrafter, AI book writing, best AI book writer, AI book generator 2025, automated book writing, AI writing assistant, book creation tool, AI content creator, digital book publishing, write books with AI',
  defaultImage: 'https://mybookcrafter.com/og-image.jpg',
  twitterHandle: '@mybookcrafter',
  socialMedia: {
    twitter: 'https://twitter.com/mybookcrafter',
    facebook: 'https://facebook.com/mybookcrafter', 
    linkedin: 'https://linkedin.com/company/mybookcrafter'
  }
};

// Generate page-specific titles
export const generatePageTitle = (pageTitle, includeBase = true) => {
  if (!pageTitle) return SEO_CONFIG.defaultTitle;
  return includeBase ? `${pageTitle} | ${SEO_CONFIG.siteName}` : pageTitle;
};

// Generate canonical URLs
export const generateCanonicalUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
};

// Generate Open Graph image URLs
export const generateOGImage = (imageName = 'og-image.jpg') => {
  return `${SEO_CONFIG.siteUrl}/${imageName}`;
};

// Generate structured data for different content types
export const generateWebApplicationLD = (customData = {}) => {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": SEO_CONFIG.siteName,
    "url": SEO_CONFIG.siteUrl,
    "description": SEO_CONFIG.defaultDescription,
    "applicationCategory": "WritingApplication",
    "operatingSystem": "Web Browser",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": 150
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    ...customData
  };
};

export const generateOrganizationLD = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SEO_CONFIG.siteName,
    "url": SEO_CONFIG.siteUrl,
    "logo": generateOGImage('logo.png'),
    "sameAs": Object.values(SEO_CONFIG.socialMedia),
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": `${SEO_CONFIG.siteUrl}/contact`
    }
  };
};

export const generateBreadcrumbLD = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": generateCanonicalUrl(crumb.path)
    }))
  };
};

// Performance optimization utilities
export const preloadCriticalResources = () => {
  const resources = [
    { href: 'https://fonts.googleapis.com', rel: 'dns-prefetch' },
    { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossorigin: true },
    { href: '/fonts/inter-var.woff2', rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: true }
  ];

  resources.forEach(resource => {
    const link = document.createElement('link');
    Object.entries(resource).forEach(([key, value]) => {
      if (key === 'crossorigin') link.crossOrigin = value;
      else link[key] = value;
    });
    document.head.appendChild(link);
  });
};

// Meta tag management
export const updateMetaTag = (name, content, property = false) => {
  const attribute = property ? 'property' : 'name';
  let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, name);
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', content);
};

// JSON-LD script injection
export const injectStructuredData = (data) => {
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) existing.remove();
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// Analytics and tracking utilities
export const trackPageView = (page, title) => {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: title,
      page_location: window.location.href
    });
  }
  
  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
  }
};

// Social sharing utilities
export const generateSocialShareUrls = (url, title, description) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=mybookcrafter`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`
  };
};

export default {
  SEO_CONFIG,
  generatePageTitle,
  generateCanonicalUrl,
  generateOGImage,
  generateWebApplicationLD,
  generateOrganizationLD,
  generateBreadcrumbLD,
  preloadCriticalResources,
  updateMetaTag,
  injectStructuredData,
  trackPageView,
  generateSocialShareUrls
};