import 'express-serve-static-core';
import { User } from 'src/common/interfaces';

declare module 'express-serve-static-core' {
  interface Request {
    user: User;
  }
}
