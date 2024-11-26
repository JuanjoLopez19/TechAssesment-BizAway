import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from 'nestjs-prisma';
import globalMessages from 'src/common/messages';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class TripsGuard implements CanActivate {
  private readonly logger = new Logger(TripsGuard.name);

  constructor(
    private readonly utils: UtilsService,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user)
      throw new UnauthorizedException(
        this.utils.buildErrorResponse(
          'UNAUTHORIZED',
          globalMessages[401].UNAUTHORIZED.SHORT,
          globalMessages[401].UNAUTHORIZED.LONG,
        ),
      );
    if (!request.body)
      throw new InternalServerErrorException(
        this.utils.buildErrorResponse(
          'NO_BODY',
          globalMessages[400].BODY_EMPTY.SHORT,
          globalMessages[400].BODY_EMPTY.LONG,
        ),
      );

    if (this.utils.keysChecker(request.body, ['id'])) {
      const { id }: { id: string } = request.body;
      const { id: userId } = request.user;

      try {
        await this.prisma.lists.findUniqueOrThrow({
          where: { id_trip_id_user: { id_trip: id, id_user: userId } },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          return true;
        }
        this.logger.error(e);
        throw new InternalServerErrorException(
          this.utils.buildErrorResponse(
            'INTERNAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
        );
      }
      throw new BadRequestException(
        this.utils.buildErrorResponse(
          'ALREADY_SAVED',
          'Trip already saved',
          'Trip already saved',
        ),
      );
    } else {
      throw new InternalServerErrorException(
        this.utils.buildErrorResponse(
          'NO_ID',
          globalMessages[400].BODY_EMPTY.SHORT,
          globalMessages[400].BODY_EMPTY.LONG,
        ),
      );
    }
  }
}
