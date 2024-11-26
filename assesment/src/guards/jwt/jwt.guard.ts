import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { DecodedPayload } from 'src/common/interfaces';
import globalMessages from 'src/common/messages';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigurationService,
    private readonly utils: UtilsService,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractFromCookie(
      request,
      this.config.crypto.cookieName,
    );

    if (!token) {
      throw new UnauthorizedException(
        this.utils.buildErrorResponse(
          'UNAUTHORIZED',
          globalMessages[401].UNAUTHORIZED.SHORT,
          globalMessages[401].UNAUTHORIZED.LONG,
        ),
      );
    }

    try {
      const decoded = this.jwtService.verify<DecodedPayload>(token, {
        secret: this.config.crypto.jwtSecret,
      });

      const user = await this.prisma.users.findFirstOrThrow({
        where: { id: decoded.id },
        select: { id: true, username: true },
      });
      request.user = {
        id: user.id,
        username: user.username,
      };
      return true;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError)
        throw new UnauthorizedException(
          this.utils.buildErrorResponse(
            'UNAUTHORIZED',
            globalMessages[401].UNAUTHORIZED.SHORT,
            globalMessages[401].UNAUTHORIZED.LONG,
          ),
        );
      else if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          this.utils.buildErrorResponse(
            'TOKEN_EXPIRED',
            globalMessages[401].UNAUTHORIZED.SHORT,
            globalMessages[401].UNAUTHORIZED.LONG,
          ),
        );
      } else if (e instanceof JsonWebTokenError) {
        this.logger.error(e);
        throw new UnauthorizedException(
          this.utils.buildErrorResponse(
            'TOKEN_INVALID',
            globalMessages[401].UNAUTHORIZED.SHORT,
            globalMessages[401].UNAUTHORIZED.LONG,
          ),
        );
      } else {
        this.logger.error(e);
        throw new InternalServerErrorException(
          this.utils.buildErrorResponse(
            'INTERVAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
        );
      }
    }
  }

  private extractFromCookie(request: Request, cookieName: string) {
    return request.cookies[cookieName] ?? null;
  }
}
