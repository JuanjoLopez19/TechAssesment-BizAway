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
  ApiParam,
} from '@nestjs/swagger';
import { validateSync } from 'class-validator';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto';
import { ErrorResponseEntity, SuccessResponseEntity } from 'src/common/entity';
import { JwtGuard } from 'src/guards/jwt/jwt.guard';
import { TripsGuard } from 'src/guards/trips/trips.guard';
import { UtilsService } from 'src/utils/utils.service';
import { QueryDto } from './dto/query.dto';
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
  async addToSavedList(@Req() req: Request, @Body() data: TripDto) {
    return await this.tripsService.addToSavedList(req.user, data);
  }
}
