export type LibraryTab = 'my-books' | 'all-books';

export interface MyEbook {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  publishedDate: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  totalRevenue: number;
  status: 'published' | 'draft' | 'unpublished';
  marketplaceCount: number;
  description?: string;
  shortPdfUrl?: string;
  shortPdfName?: string;
  shortPdfUploadedAt?: string;
}

export interface PublicEbook {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  authorName: string;
  category: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  previewAvailable: boolean;
  publishedDate: string;
}

export interface LibraryStats {
  totalPublished: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
}

export interface EbookFilters {
  category: string;
  search: string;
}
