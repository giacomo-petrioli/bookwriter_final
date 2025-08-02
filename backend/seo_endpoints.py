from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import PlainTextResponse, JSONResponse
import xml.etree.ElementTree as ET
from datetime import datetime
import os

router = APIRouter()

@router.get("/sitemap.xml", response_class=PlainTextResponse)
async def generate_sitemap():
    """Generate dynamic sitemap.xml"""
    
    # Create root element
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
    urlset.set("xsi:schemaLocation", "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd")
    
    # Define pages with their properties
    pages = [
        {
            "loc": "https://mybookcrafter.com/",
            "lastmod": datetime.now().strftime("%Y-%m-%d"),
            "changefreq": "daily",
            "priority": "1.0"
        },
        {
            "loc": "https://mybookcrafter.com/app",
            "lastmod": datetime.now().strftime("%Y-%m-%d"),
            "changefreq": "weekly", 
            "priority": "0.9"
        },
        {
            "loc": "https://mybookcrafter.com/credits",
            "lastmod": datetime.now().strftime("%Y-%m-%d"),
            "changefreq": "monthly",
            "priority": "0.8"
        },
        {
            "loc": "https://mybookcrafter.com/features",
            "lastmod": datetime.now().strftime("%Y-%m-%d"),
            "changefreq": "monthly",
            "priority": "0.7"
        },
        {
            "loc": "https://mybookcrafter.com/how-it-works",
            "lastmod": datetime.now().strftime("%Y-%m-%d"),
            "changefreq": "monthly",
            "priority": "0.7"
        },
        {
            "loc": "https://mybookcrafter.com/examples",
            "lastmod": datetime.now().strftime("%Y-%m-%d"),
            "changefreq": "weekly",
            "priority": "0.6"
        }
    ]
    
    # Add each page to sitemap
    for page in pages:
        url = ET.SubElement(urlset, "url")
        
        loc = ET.SubElement(url, "loc")
        loc.text = page["loc"]
        
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = page["lastmod"]
        
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = page["changefreq"]
        
        priority = ET.SubElement(url, "priority")
        priority.text = page["priority"]
    
    # Convert to string
    xml_str = ET.tostring(urlset, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    return Response(
        content=xml_declaration + xml_str,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
            "Content-Type": "application/xml; charset=utf-8"
        }
    )

@router.get("/robots.txt", response_class=PlainTextResponse)
async def generate_robots():
    """Generate dynamic robots.txt"""
    
    robots_content = """User-agent: *
Allow: /

# Enhanced SEO for MyBookCrafter.com
Sitemap: https://mybookcrafter.com/sitemap.xml

# Allow all major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Block unnecessary crawlers
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# Crawl delay for better server performance
Crawl-delay: 1

# Primary sitemap location
Sitemap: https://mybookcrafter.com/api/sitemap.xml
"""
    
    return Response(
        content=robots_content,
        media_type="text/plain",
        headers={
            "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
        }
    )

@router.get("/seo/meta/{page}")
async def get_page_meta(page: str):
    """Get SEO meta data for specific pages"""
    
    meta_data = {
        "home": {
            "title": "MyBookCrafter AI - Write Amazing Books with AI | #1 AI Book Writing Platform 2025",
            "description": "🚀 Create professional books effortlessly with AI-powered writing assistance. From outline to final draft, MyBookCrafter AI helps you craft compelling stories and content. Join 10,000+ writers using the best AI book creation platform!",
            "keywords": "mybookcrafter, AI book writing, best AI book writer, AI book generator 2025, automated book writing, AI writing assistant, book creation tool, AI content creator, digital book publishing, write books with AI",
            "og_image": "https://mybookcrafter.com/og-image-home.jpg",
            "canonical": "https://mybookcrafter.com/"
        },
        "app": {
            "title": "Book Writing Dashboard - MyBookCrafter AI | AI-Powered Writing Interface",
            "description": "Access your AI-powered book writing dashboard. Create, edit, and manage your books with advanced AI assistance. Professional writing tools for authors and content creators.",
            "keywords": "book writing dashboard, AI writing tool, book creation interface, writing assistant, book management, AI book generator, writing productivity tools",
            "og_image": "https://mybookcrafter.com/og-image-app.jpg", 
            "canonical": "https://mybookcrafter.com/app"
        },
        "credits": {
            "title": "Buy Credits - MyBookCrafter AI | Affordable AI Writing Packages",
            "description": "Purchase credits to unlock the full power of AI book writing. Affordable packages for all writers. Start creating professional books today with flexible pricing.",
            "keywords": "buy writing credits, AI writing pricing, book creation credits, writing subscription, AI content pricing, book writing packages, affordable AI writing",
            "og_image": "https://mybookcrafter.com/og-image-credits.jpg",
            "canonical": "https://mybookcrafter.com/credits"
        }
    }
    
    if page not in meta_data:
        raise HTTPException(status_code=404, detail="Page meta data not found")
    
    return JSONResponse(
        content=meta_data[page],
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            "Content-Type": "application/json"
        }
    )

@router.get("/seo/structured-data/{page}")
async def get_structured_data(page: str):
    """Get structured data for specific pages"""
    
    base_url = "https://mybookcrafter.com"
    
    structured_data = {
        "home": {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebApplication",
                    "@id": f"{base_url}/#webapp",
                    "name": "MyBookCrafter AI",
                    "alternateName": ["MyBookCrafter", "AI Book Writer"],
                    "url": base_url,
                    "description": "AI-powered book writing platform that helps users create professional books from outline to final draft",
                    "applicationCategory": "WritingApplication",
                    "operatingSystem": "Web Browser",
                    "aggregateRating": {
                        "@type": "AggregateRating", 
                        "ratingValue": "4.8",
                        "ratingCount": 150
                    }
                },
                {
                    "@type": "Organization",
                    "@id": f"{base_url}/#organization",
                    "name": "MyBookCrafter AI",
                    "url": base_url,
                    "logo": f"{base_url}/logo.png",
                    "sameAs": [
                        "https://twitter.com/mybookcrafter",
                        "https://facebook.com/mybookcrafter"
                    ]
                }
            ]
        }
    }
    
    if page not in structured_data:
        raise HTTPException(status_code=404, detail="Structured data not found")
    
    return JSONResponse(
        content=structured_data[page],
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "application/json"
        }
    )