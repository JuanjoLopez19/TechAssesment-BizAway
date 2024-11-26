import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP Logger');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, baseUrl: url } = request;
    response.on('close', () => {
      const { statusCode } = response;

      this.logger.log(`${method} ${url} ${statusCode} -${ip}`);
    });

    next();
  }
}
