export interface PaginationLinks {
  self: string;
  first: string;
  prev: string;
  next: string;
  last: string;
  totalPages: number;
}

export interface DecodedPayload {
  id: number;
}

export interface User {
  id: number;
  username: string;
}
