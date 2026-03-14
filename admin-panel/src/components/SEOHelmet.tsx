import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'book' | 'article';
  author?: string;
  publishedTime?: string;
  isbn?: string;
  canonical?: string;
  breadcrumb?: { name: string; item: string }[];
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({
  title,
  description,
  image = '/assets/og-image.png',
  type = 'website',
  author,
  publishedTime,
  isbn,
  canonical,
  breadcrumb
}) => {
  const location = useLocation();
  const siteName = 'Rizquna Publishing';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const currentUrl = canonical || `https://rizqunapublishing.com${location.pathname}`;
  const defaultDescription = 'Penerbit dan Percetakan Profesional di Purwokerto. Melayani penerbitan buku ISBN, HAKI, dan distribusi nasional.';

  // JSON-LD for Breadcrumbs
  const breadcrumbSchema = breadcrumb ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('http') ? item.item : `https://rizqunapublishing.com${item.item}`
    }))
  } : null;

  // JSON-LD for Book (if applicable)
  const bookSchema = type === 'book' ? {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author
    },
    "isbn": isbn,
    "publisher": {
      "@type": "Organization",
      "name": siteName
    },
    "datePublished": publishedTime,
    "image": image.startsWith('http') ? image : `https://rizqunapublishing.com${image}`
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image.startsWith('http') ? image : `https://rizqunapublishing.com${image}`} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `https://rizqunapublishing.com${image}`} />

      {/* Article/Book specific */}
      {author && <meta name="author" content={author} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Structured Data */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {bookSchema && (
        <script type="application/ld+json">
          {JSON.stringify(bookSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHelmet;
