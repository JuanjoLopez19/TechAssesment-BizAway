import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { UtilsService } from 'src/utils/utils.service';
import globalMessages from 'src/common/messages';

abstract class Middleware {
  protected logger = new Logger('AuthMiddleware');
  constructor(
    protected prisma: PrismaService,
    protected utils: UtilsService,
  ) {}
  abstract use(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<Response<any, Record<string, any>> | undefined>;
}
@Injectable()
export class AuthMiddleware extends Middleware implements NestMiddleware {
  constructor(prisma: PrismaService, utils: UtilsService) {
    super(prisma, utils);
  }

  async use(request: Request, response: Response, next: NextFunction) {
    if (!request.body)
      return response
        .status(400)
        .json(
          this.utils.buildErrorResponse(
            'NO_BODY',
            globalMessages[400].BODY_EMPTY.SHORT,
            globalMessages[400].BODY_EMPTY.LONG,
          ),
        );

    if (this.utils.keysChecker(request.body, ['username'])) {
      const { username }: { username: string } = request.body;

      try {
        await this.prisma.users.findFirstOrThrow({
          where: { username },
        });
        return response
          .status(409)
          .json(
            this.utils.buildErrorResponse(
              'NO_UNIQUE',
              globalMessages[409].USERNAME_IN_USE.SHORT,
              globalMessages[409].USERNAME_IN_USE.LONG,
            ),
          );
      } catch (e) {
        if (e.code === 'P2025') {
          this.logger.log('User not found');
          next();
        } else {
          this.logger.error(e);
          return response
            .status(500)
            .json(
              this.utils.buildErrorResponse(
                'INTERNAL_ERROR',
                globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
                globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
              ),
            );
        }
      }
    } else {
      return response
        .status(400)
        .json(
          this.utils.buildErrorResponse(
            'MISSING_KEYS',
            globalMessages[400].MISSING_PARAMETERS_BODY.SHORT,
            globalMessages[400].MISSING_PARAMETERS_BODY.LONG,
          ),
        );
    }
  }
}
