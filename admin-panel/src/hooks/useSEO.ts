import { useEffect } from 'react';

interface SEOMetadata {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book';
}

/**
 * Hook untuk mengatur SEO meta tags
 * Atur title, description, dan Open Graph tags
 */
export const useSEO = (metadata: SEOMetadata) => {
  useEffect(() => {
    // Set title
    document.title = `${metadata.title} | Rizquna Elfath`;

    // Set meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', metadata.description);

    // Set OG tags
    const setOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setOGTag('og:title', metadata.title);
    setOGTag('og:description', metadata.description);
    setOGTag('og:type', metadata.type || 'website');
    setOGTag('og:url', metadata.url || window.location.href);
    
    if (metadata.image) {
      setOGTag('og:image', metadata.image);
    }

    // Set Twitter tags
    const setTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="twitter:${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', `twitter:${name}`);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setTwitterTag('card', 'summary_large_image');
    setTwitterTag('title', metadata.title);
    setTwitterTag('description', metadata.description);
    
    if (metadata.image) {
      setTwitterTag('image', metadata.image);
    }

    // Cleanup function (optional - remove when component unmounts)
    return () => {
      document.title = 'Rizquna Elfath';
    };
  }, [metadata]);
};
