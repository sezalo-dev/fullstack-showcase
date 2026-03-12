export interface Ad {
  id: string;
  title: string;
  description?: string;
  categorySlug?: string;
  status?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PagedAds {
  items: Ad[];
  page: number;
  size: number;
  count: number;
}

