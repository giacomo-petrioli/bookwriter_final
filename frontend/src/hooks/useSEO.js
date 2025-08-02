import { useEffect } from 'react';

// Custom hook for dynamic SEO management
export const useSEO = ({
  title,
  description,
  keywords,
  url,
  image,
  type = 'website'
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords) {
      metaKeywords.setAttribute('content', keywords);
    }

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical && url) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    if (canonical && url) {
      canonical.href = url;
    }

    // Update Open Graph tags
    const updateOGTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (title) updateOGTag('og:title', title);
    if (description) updateOGTag('og:description', description);
    if (url) updateOGTag('og:url', url);
    if (image) updateOGTag('og:image', image);
    if (type) updateOGTag('og:type', type);

    // Update Twitter Card tags
    const updateTwitterTag = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (title) updateTwitterTag('twitter:title', title);
    if (description) updateTwitterTag('twitter:description', description);
    if (image) updateTwitterTag('twitter:image', image);

  }, [title, description, keywords, url, image, type]);
};

// SEO utility functions
export const generateMetaTags = (pageData) => {
  const baseTitle = "MyBookCrafter AI";
  const baseDomain = "https://mybookcrafter.com";
  
  return {
    title: pageData.title ? `${pageData.title} | ${baseTitle}` : baseTitle,
    description: pageData.description || "Create professional books effortlessly with AI-powered writing assistance. From outline to final draft, MyBookCrafter AI helps you craft compelling stories and content.",
    keywords: pageData.keywords || "mybookcrafter, AI book writing, book creation tool, AI writing assistant, automated book writing, book generator, AI content creation, digital book publishing, write books with AI, MyBookCrafter AI",
    url: pageData.url ? `${baseDomain}${pageData.url}` : baseDomain,
    image: pageData.image || `${baseDomain}/og-image.jpg`,
    type: pageData.type || "website"
  };
};

// Page-specific SEO configurations
export const SEO_PAGES = {
  home: {
    title: "MyBookCrafter AI - Write Amazing Books with AI",
    description: "Create professional books effortlessly with AI-powered writing assistance. From outline to final draft, MyBookCrafter AI helps you craft compelling stories and content.",
    keywords: "mybookcrafter, AI book writing, book creation tool, AI writing assistant, automated book writing, book generator, AI content creation, digital book publishing, write books with AI, MyBookCrafter AI, artificial intelligence writing, automated content creation",
    url: "/",
    type: "website"
  },
  app: {
    title: "Book Writing Dashboard - MyBookCrafter AI",
    description: "Access your AI-powered book writing dashboard. Create, edit, and manage your books with advanced AI assistance. Start writing your next bestseller today.",
    keywords: "book writing dashboard, AI writing tool, book creation interface, writing assistant, book management, AI book generator, writing productivity",
    url: "/app",
    type: "webapp"
  },
  credits: {
    title: "Buy Credits - MyBookCrafter AI",
    description: "Purchase credits to unlock the full power of AI book writing. Affordable packages for all writers. Start creating professional books today.",
    keywords: "buy writing credits, AI writing pricing, book creation credits, writing subscription, AI content pricing, book writing packages",
    url: "/credits",
    type: "product"
  },
  payment_success: {
    title: "Payment Successful - MyBookCrafter AI",
    description: "Thank you for your purchase! Your credits have been added to your account. Start creating amazing books with AI assistance.",
    keywords: "payment successful, credits purchased, AI writing account, book writing subscription",
    url: "/payment-success",
    type: "article"
  }
};

export default useSEO;