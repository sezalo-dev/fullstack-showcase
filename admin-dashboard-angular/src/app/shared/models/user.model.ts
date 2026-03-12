export interface User {
  id: string;
  email: string;
  name?: string;
  status?: string;
  locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PagedUsers {
  items: User[];
  page: number;
  size: number;
  count: number;
}

