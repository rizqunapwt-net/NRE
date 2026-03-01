export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string;
  };
  tags: string[];
  publishedDate: string;
  readTime: number;
  views: number;
}

export interface BlogApiItem {
  id: string;
  title: string;
  content: string;
  priority: string;
  published_at: string;
  expires_at: string | null;
  department: string | null;
  is_active: boolean;
  image_url: string | null;
  file_url: string | null;
  view_count: number;
  creator?: {
    id?: number;
    name?: string;
  };
}

export interface TocHeading {
  id: string;
  level: 2 | 3 | 4;
  text: string;
}
