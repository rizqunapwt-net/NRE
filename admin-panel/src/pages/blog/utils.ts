import type { Article, BlogApiItem, TocHeading } from './types';

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Posts' },
  { id: 'writing-tips', label: 'Writing Tips' },
  { id: 'publishing-guide', label: 'Publishing Guide' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'success-stories', label: 'Success Stories' },
  { id: 'platform-updates', label: 'Platform Updates' },
] as const;

const categoryByDepartment: Record<string, { name: string; slug: string }> = {
  writing: { name: 'Writing Tips', slug: 'writing-tips' },
  editorial: { name: 'Publishing Guide', slug: 'publishing-guide' },
  publishing: { name: 'Publishing Guide', slug: 'publishing-guide' },
  marketing: { name: 'Marketing', slug: 'marketing' },
  sales: { name: 'Marketing', slug: 'marketing' },
  author: { name: 'Success Stories', slug: 'success-stories' },
  platform: { name: 'Platform Updates', slug: 'platform-updates' },
  product: { name: 'Platform Updates', slug: 'platform-updates' },
  update: { name: 'Platform Updates', slug: 'platform-updates' },
};

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildArticleSlug(title: string, id: string): string {
  return `${slugify(title)}--${id}`;
}

export function parseIdFromSlug(slugOrId: string): string {
  const split = slugOrId.split('--');
  return split.length > 1 ? split[split.length - 1] : slugOrId;
}

export function getCategory(department: string | null): { name: string; slug: string } {
  if (!department) return { name: 'Platform Updates', slug: 'platform-updates' };

  const lower = department.toLowerCase();
  for (const [key, category] of Object.entries(categoryByDepartment)) {
    if (lower.includes(key)) return category;
  }

  return { name: 'Publishing Guide', slug: 'publishing-guide' };
}

function inferTags(source: string, category: string): string[] {
  const base = [category];
  const map = ['writing', 'isbn', 'publishing', 'marketing', 'author', 'ebook', 'royalty'];
  const lower = source.toLowerCase();
  map.forEach((tag) => {
    if (lower.includes(tag)) base.push(tag);
  });
  return [...new Set(base)];
}

export function toArticle(item: BlogApiItem): Article {
  const plain = stripHtml(item.content || '');
  const category = getCategory(item.department);
  const readTime = Math.max(1, Math.ceil(plain.split(' ').filter(Boolean).length / 200));

  return {
    id: item.id,
    title: item.title,
    slug: buildArticleSlug(item.title, item.id),
    excerpt: plain.slice(0, 170) + (plain.length > 170 ? '...' : ''),
    content: item.content,
    featuredImage: item.image_url,
    category: {
      id: category.slug,
      name: category.name,
      slug: category.slug,
    },
    author: {
      id: String(item.creator?.id ?? '0'),
      name: item.creator?.name || 'Tim Editorial Rizquna',
      avatar: null,
      bio: 'Editor dan tim konten yang berfokus pada pengembangan penulis dan publikasi buku.',
    },
    tags: inferTags(`${item.title} ${plain}`, category.slug),
    publishedDate: item.published_at,
    readTime,
    views: item.view_count || 0,
  };
}

export function extractHeadingsFromHtml(html: string): TocHeading[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const nodes = Array.from(doc.querySelectorAll('h2, h3, h4'));

  return nodes.map((node, index) => {
    const level = Number(node.tagName.replace('H', '')) as 2 | 3 | 4;
    const text = (node.textContent || `Section ${index + 1}`).trim();
    const id = node.id || slugify(text) || `section-${index + 1}`;
    node.id = id;

    return {
      id,
      level,
      text,
    };
  });
}

export function withHeadingIds(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const nodes = Array.from(doc.querySelectorAll('h2, h3, h4'));

  nodes.forEach((node, index) => {
    const text = (node.textContent || `Section ${index + 1}`).trim();
    node.id = node.id || slugify(text) || `section-${index + 1}`;
  });

  return doc.body.innerHTML;
}
