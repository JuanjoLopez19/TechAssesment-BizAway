import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { validateSync } from 'class-validator';
import { Request, Response } from 'express';
import { PaginationQueryDto } from 'src/common/dto';
import { ErrorResponseEntity, SuccessResponseEntity } from 'src/common/entity';
import { JwtGuard } from 'src/guards/jwt/jwt.guard';
import { TripsGuard } from 'src/guards/trips/trips.guard';
import { UtilsService } from 'src/utils/utils.service';
import { ExportQueryParamsDto, QueryDto } from './dto/query.dto';
import { TripDto } from './dto/trip.dto';
import {
  SuccessResponseTrip,
  SuccessResponseTrips,
  SuccessResponseTripsList,
} from './entities/trip.entity';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly utilsService: UtilsService,
  ) {}

  @Get('/')
  @ApiOkResponse({
    description: 'Get filtered and sorted trips',
    type: SuccessResponseTrips,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiOperation({
    summary: 'Get filtered and sorted trips',
    description:
      'Given a pair of origin and destination airports, retrieve a list of trips between them and be able to sort them by cost or duration in either ascending or descending order.',
  })
  async getTrips(@Query() params: QueryDto) {
    return await this.tripsService.getTrips(params);
  }

  @UseGuards(JwtGuard)
  @Get('/lists')
  @ApiOkResponse({
    description: 'Get filtered and sorted trips',
    type: SuccessResponseTripsList,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseEntity,
  })
  @ApiForbiddenResponse({
    description: 'User not authorized',
    type: ErrorResponseEntity,
  })
  @ApiOperation({
    summary: 'Get saved list of trips',
    description:
      "Return the user's saved list and allow filtering and sorting it between the cost, the duration and the added to list date.",
  })
  async getSavedList(@Req() req: Request, @Query() query: PaginationQueryDto) {
    return await this.tripsService.getSavedList(
      req.user,
      query,
      req.originalUrl.split('?')[0],
    );
  }

  @UseGuards(JwtGuard)
  @Delete('/lists/:id')
  @ApiNoContentResponse({ description: 'Trip removed from saved list' })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ErrorResponseEntity,
  })
  @ApiOperation({
    summary: 'Remove trip from saved list',
    description: "Remove a trip from the user's saved list if it's in.",
  })
  async removeFromSavedList(@Req() req: Request, @Param('id') id: string) {
    return await this.tripsService.removeFromSavedList(req.user, id);
  }

  @Get('/:id')
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the trip',
    required: true,
    schema: { type: 'string' },
  })
  @ApiOkResponse({
    description: 'Get trip by id',
    type: SuccessResponseTrip,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiOperation({
    summary: 'Get trip by id',
    description:
      'Get a trip by its unique identifier, return it from the caché, the database or fetching it from the 3rd Party API.',
  })
  async getTripById(@Param('id') id: string) {
    // Create a DTO object and validate it
    const tripDto = new TripDto();
    tripDto.id = id;

    const errors = validateSync(tripDto);
    if (errors.length > 0) {
      throw new BadRequestException(
        this.utilsService.buildErrorResponse(
          'VALIDATION_ERROR',
          'Validation error',
          errors.toString(),
        ),
      );
    }

    return await this.tripsService.getTripById(tripDto);
  }

  @UseGuards(JwtGuard, TripsGuard)
  @Post('/lists')
  @ApiCreatedResponse({
    description: 'Add trip to saved list',
    type: SuccessResponseEntity,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ErrorResponseEntity,
  })
  @ApiForbiddenResponse({
    description: 'Trip already in saved list',
    type: ErrorResponseEntity,
  })
  @ApiNotFoundResponse({
    description: 'Trip not found',
    type: ErrorResponseEntity,
  })
  @ApiOperation({
    summary: 'Add trip to saved list',
    description: 'Add a trip to the user saved list.',
  })
  async addToSavedList(@Req() req: Request, @Body() data: TripDto) {
    return await this.tripsService.addToSavedList(req.user, data);
  }

  @UseGuards(JwtGuard)
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'User not logged in',
    type: ErrorResponseEntity,
  })
  @ApiOkResponse({
    description: 'Success exporting list',
    content: {
      'application/json': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'The exported file in the desired format',
        },
      },
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'The exported file in the desired format',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Export list of trips',
    description: 'Export the user saved list of trips in the desired format.',
  })
  @Get('/lists/export')
  async exportList(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query() query: ExportQueryParamsDto,
  ) {
    return await this.tripsService.exportList(req.user, query);
  }
}
