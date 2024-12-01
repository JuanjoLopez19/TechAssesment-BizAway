import {
  ALLOWED_DIRECTION_SORTING,
  ALLOWED_EXPORT_TYPES,
  ALLOWED_QUERY_SORTING,
  ALLOWED_SORTING,
  ALLOWED_TAGS,
} from './const';
import { PaginationLinks } from './interfaces';

export type successResponse = {
  data: object;
  message: string;
  links?: PaginationLinks;
};
export type errorResponse = {
  error: string;
  message: string;
  detail: string;
};

export type httpOption = {
  httpPort: number;
  httpsPort: number;
  httpsHostPort: number;
};

export type appOptions = {
  name: string;
  apiUrl: string;
  apiToken: string;
  apiPath: string;
};

export type cryptoOptions = {
  jwtSecret: string;
  jwtExpiresIn: string;
  saltRounds: number;
  cookieName: string;
};

export type redisOptions = {
  host: string;
  port: number;
  password: string;
  ttl: number;
};

export type Sorting = (typeof ALLOWED_SORTING)[number];
export type QuerySorting = (typeof ALLOWED_QUERY_SORTING)[number];

export type DirectionSorting = (typeof ALLOWED_DIRECTION_SORTING)[number];

export type ExportTypes = (typeof ALLOWED_EXPORT_TYPES)[number];

export type Tags = (typeof ALLOWED_TAGS)[number];
