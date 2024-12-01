import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { PaginationQueryDto } from 'src/common/dto';
import { CachingService } from '../caching/caching.service';

import { User } from 'src/common/interfaces';
import globalMessages from 'src/common/messages';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { UtilsService } from 'src/utils/utils.service';

import { parse } from 'json2csv';
import { RequestService } from 'src/request/request.service';
import { ExportQueryParamsDto, QueryDto } from './dto/query.dto';
import { TripDto } from './dto/trip.dto';
import { Trip } from './entities/trip.entity';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly configurationService: ConfigurationService,
    private readonly cachingService: CachingService,
    private readonly requestService: RequestService,
  ) {}

  /**
   * Fetches trips based on the provided query parameters.
   *
   * @param {QueryDto} params - The query parameters for fetching trips.
   * @param {string} params.origin - The origin location for the trips.
   * @param {string} params.destination - The destination location for the trips.
   * @param {string} [params.sort_by] - The sorting criteria for the trips (e.g., 'fastest' or 'cheapest').
   * @param {string} [params.sort_direction] - The sorting direction ('asc' for ascending or 'desc' for descending).
   *
   * @returns {Promise<{ data: any; code: number }>} - A promise that resolves to an object containing the response data and status code.
   *
   * @throws {Error} - Throws an error if there is an issue with fetching trips.
   */
  async getTrips(params: QueryDto) {
    try {
      const { origin, destination, sort_by, sort_direction } = params;

      const key = `trips:${origin}:${destination}:${sort_by}:${sort_direction}`;
      const cached = await this.cachingService.get<Trip[]>(key);

      if (cached) {
        return {
          data: this.utils.buildSuccessResponse(
            cached,
            'Trips fetched successfully',
          ),
          code: 200,
        };
      }

      const res = await this.requestService.getAll<Trip[]>(
        destination,
        origin,
        this.configurationService.app.apiPath,
      );

      if (res.status !== 200) {
        this.logger.error(res.statusText);
        return {
          data: this.utils.buildErrorResponse(
            'INTERNAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
          code: res.status,
        };
      }

      let column = '';
      if (sort_by) {
        column = sort_by === 'fastest' ? 'duration' : 'cost';
      }

      const items = res.data;

      const sorter = (a: Trip, b: Trip) => {
        return sort_direction === 'asc'
          ? a[column] - b[column]
          : b[column] - a[column];
      };

      const cachingItems = column === '' ? items : items.toSorted(sorter);
      await this.cachingService.set(key, cachingItems);
      return {
        data: this.utils.buildSuccessResponse(
          cachingItems,
          'Trips fetched successfully',
        ),
        code: 200,
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }

  /**
   * Retrieves a trip by its ID.
   *
   * This method first attempts to fetch the trip data from the cache. If the data is not found in the cache,
   * it then queries the database. If the trip is still not found, it makes an external API call to fetch the trip data.
   * The fetched data is then cached for future requests.
   *
   * @param {TripDto} data - The data transfer object containing the trip ID.
   * @returns {Promise<{ data: any, code: number }>} - A promise that resolves to an object containing the response data and status code.
   *
   * @throws Will throw an error if the trip cannot be fetched due to an internal server error.
   */
  async getTripById(data: TripDto): Promise<{ data: any; code: number }> {
    try {
      const { id } = data;
      const cached = await this.cachingService.get(`trip:${id}`);
      if (cached) {
        return {
          data: this.utils.buildSuccessResponse(
            cached,
            'Trip fetched successfully',
          ),
          code: 200,
        };
      }
      const trip = await this.prisma.trips.findUnique({ where: { id } });
      if (trip) {
        await this.cachingService.set(`trip:${id}`, trip);
        return {
          data: this.utils.buildSuccessResponse(
            trip,
            'Trip fetched successfully',
          ),
          code: 200,
        };
      }
      const res = await this.requestService.getById<Trip>(
        id,
        this.configurationService.app.apiPath,
      );

      if (res.status !== 200) {
        this.logger.error(res.statusText);
        return {
          data: this.utils.buildErrorResponse(
            'INTERNAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
          code: res.status,
        };
      }
      await this.cachingService.set(`trip:${id}`, res.data);
      return {
        data: this.utils.buildSuccessResponse(
          res.data,
          'Trip fetched successfully',
        ),
        code: 200,
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }

  /**
   * Adds a trip to the user's saved list.
   *
   * @param {user} user - The user object containing user details.
   * @param {TripDto} data - The trip data transfer object containing trip details.
   * @returns {Promise<{ data: any; code: number }>} - A promise that resolves to an object containing the response data and status code.
   *
   * @throws {Prisma.PrismaClientKnownRequestError} - If the user is not found in the database.
   */
  async addToSavedList(
    user: User,
    data: TripDto,
  ): Promise<{ data: any; code: number }> {
    try {
      const { id } = user;
      const u = await this.prisma.users.findUniqueOrThrow({ where: { id } });

      const trip = await this.prisma.trips.findFirst({
        where: { id: data.id },
      });

      let temp = '';
      if (!trip) {
        const res = await this.requestService.getById<Trip>(
          data.id,
          this.configurationService.app.apiPath,
        );

        if (res.status !== 200) {
          this.logger.error(res.statusText);
          return {
            data: this.utils.buildErrorResponse(
              'INTERNAL_ERROR',
              globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
              globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
            ),
            code: res.status,
          };
        }
        const trip = await this.prisma.trips.create({ data: res.data });
        if (!trip) {
          return {
            data: this.utils.buildErrorResponse(
              'INTERNAL_ERROR',
              globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
              globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
            ),
            code: 500,
          };
        }
        temp = trip.id;
      } else {
        temp = trip.id;
      }

      const item = await this.prisma.lists.create({
        data: { id_trip: temp, id_user: u.id },
      });

      if (!item) {
        return {
          data: this.utils.buildErrorResponse(
            'INTERNAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
          code: 500,
        };
      } else {
        return {
          data: this.utils.buildSuccessResponse({}, 'Trip added to saved list'),
          code: 201,
        };
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          data: this.utils.buildErrorResponse(
            'USER_NOT_FOUND',
            globalMessages[404].NOT_FOUND.SHORT,
            globalMessages[404].NOT_FOUND.LONG,
          ),
          code: 404,
        };
      }
      this.logger.error(e);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }

  /**
   * Retrieves a paginated and sorted list of saved trips for a user.
   *
   * @param {user} user - The user object containing user details.
   * @param {PaginationQueryDto} query - The pagination and sorting query parameters.
   * @param {string} route - The route for generating pagination links.
   * @returns {Promise<{ data: any; code: number }>} - A promise that resolves to an object containing the paginated and sorted list of saved trips and a status code.
   *
   * @throws {Prisma.PrismaClientKnownRequestError} - If the user is not found in the database.
   * @throws {Error} - If an internal server error occurs.
   */
  async getSavedList(
    user: User,
    query: PaginationQueryDto,
    route: string,
  ): Promise<{ data: any; code: number }> {
    try {
      const { id } = user;
      const { page, limit, sort, sorted_by } = query;
      const skip = (page - 1) * limit;

      const u = await this.prisma.users.findUniqueOrThrow({ where: { id } });

      const listItems = await this.prisma.lists.findMany({
        where: { id_user: u.id },
        select: { created_at: true, id_trip: true },
      });

      if (listItems.length === 0) {
        return {
          data: this.utils.buildSuccessResponse([], 'No trips found'),
          code: 200,
        };
      }

      const trips = await this.prisma.trips.findMany({
        where: { id: { in: listItems.map((i) => i.id_trip) } },
      });

      const merged = listItems.map((item) => {
        const trip = trips.find((t) => t.id === item.id_trip);
        return { ...item, ...trip };
      });

      const parser: { [key: string]: string } = {
        newest: 'created_at',
        oldest: 'created_at',
        fastest: 'duration',
        cheapest: 'cost',
      };
      const sorted = parser[sorted_by]
        ? merged.toSorted((a, b) => {
            const valueA = a[parser[sorted_by]];
            const valueB = b[parser[sorted_by]];

            if (sorted_by === 'newest' || sorted_by === 'oldest') {
              const dateA = new Date(valueA).getDate();
              const dateB = new Date(valueB).getDate();
              return sorted_by === 'newest' ? dateB - dateA : dateA - dateB;
            } else if (sort === 'asc') {
              if (valueA > valueB) {
                return 1;
              } else if (valueA < valueB) {
                return -1;
              } else {
                return 0;
              }
            } else if (valueA > valueB) {
              return -1;
            } else if (valueA < valueB) {
              return 1;
            } else {
              return 0;
            }
          })
        : merged;

      const paginated = sorted.slice(skip, skip + limit);
      const totalPages = Math.ceil(sorted.length / limit);

      return {
        data: this.utils.buildSuccessResponse(
          paginated.map((item) => {
            return {
              id: item.id,
              origin: item.origin,
              destination: item.destination,
              cost: item.cost,
              duration: item.duration,
              type: item.type,
              display_name: item.display_name,
              added_date: item.created_at,
            };
          }),
          'Saved list fetched successfully',
          this.utils.buildPaginationLinks(route, page, limit, totalPages),
        ),
        code: 200,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          data: this.utils.buildErrorResponse(
            'USER_NOT_FOUND',
            globalMessages[404].NOT_FOUND.SHORT,
            globalMessages[404].NOT_FOUND.LONG,
          ),
          code: 404,
        };
      }
      this.logger.error(e);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }

  /**
   * Removes a trip from the user's saved list.
   *
   * @param {user} user - The user object containing user details.
   * @param {string} id - The ID of the trip to be removed.
   * @returns {Promise<{ data: any; code: number }>} - A promise that resolves to an object containing the response data and status code.
   *
   * @throws {Prisma.PrismaClientKnownRequestError} - If the user is not found in the database.
   * @throws {Error} - If an internal server error occurs.
   */
  async removeFromSavedList(
    user: User,
    id: string,
  ): Promise<{ data: any; code: number }> {
    try {
      const { id: user_id } = user;
      const u = await this.prisma.users.findUniqueOrThrow({
        where: { id: user_id },
      });

      const item = await this.prisma.lists.findFirst({
        where: { id_trip: id, id_user: u.id },
      });

      if (!item) {
        return {
          data: this.utils.buildErrorResponse(
            'TRIP_NOT_FOUND',
            globalMessages[404].NOT_FOUND.SHORT,
            globalMessages[404].NOT_FOUND.LONG,
          ),
          code: 404,
        };
      }

      await this.prisma.lists.delete({
        where: { id_trip_id_user: { id_trip: id, id_user: user_id } },
      });

      return {
        data: this.utils.buildSuccessResponse(
          {},
          'Trip removed from saved list',
        ),
        code: 204,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          data: this.utils.buildErrorResponse(
            'USER_NOT_FOUND',
            globalMessages[404].NOT_FOUND.SHORT,
            globalMessages[404].NOT_FOUND.LONG,
          ),
          code: 404,
        };
      }
      this.logger.error(e);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }

  async exportList(user: User, type: ExportQueryParamsDto) {
    try {
      const { id: user_id } = user;
      const { type: exportType } = type;
      const u = await this.prisma.users.findUniqueOrThrow({
        where: { id: user_id },
      });

      const listItems = await this.prisma.lists.findMany({
        where: { id_user: u.id },
        select: { created_at: true, id_trip: true },
      });

      if (listItems.length === 0)
        return {
          data: this.utils.buildSuccessResponse([], 'No trips found'),
          code: 200,
        };

      const trips = await this.prisma.trips.findMany({
        where: { id: { in: listItems.map((i) => i.id_trip) } },
      });

      const merged = listItems
        .map((item) => {
          const trip = trips.find((t) => t.id === item.id_trip);
          return { ...item, ...trip };
        })
        .map((item) => {
          return {
            id: item.id,
            origin: item.origin,
            destination: item.destination,
            cost: item.cost,
            duration: item.duration,
            type: item.type,
            display_name: item.display_name,
            added_date: item.created_at,
          };
        });

      if (exportType === 'csv') {
        const csv = parse(merged);
        const buffer = Buffer.from(csv, 'utf-8');

        const stream = new StreamableFile(buffer, {
          type: 'text/csv',
          disposition: 'attachment; filename="trips.csv"',
          length: buffer.length,
        });

        return stream;
      } else {
        const buffer = Buffer.from(JSON.stringify(merged), 'utf-8');

        const stream = new StreamableFile(buffer, {
          type: 'application/json',
          disposition: 'attachment; filename="trips.json"',
          length: buffer.length,
        });

        return stream;
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          data: this.utils.buildErrorResponse(
            'USER_NOT_FOUND',
            globalMessages[404].NOT_FOUND.SHORT,
            globalMessages[404].NOT_FOUND.LONG,
          ),
          code: 404,
        };
      }
      this.logger.error(e);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }
}
