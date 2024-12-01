import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Lists, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { CachingService } from 'src/caching/caching.service';
import { PaginationQueryDto } from 'src/common/dto';
import { User } from 'src/common/interfaces';
import { errorResponse, successResponse } from 'src/common/types';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { RequestService } from 'src/request/request.service';
import { ExportQueryParamsDto, QueryDto } from 'src/trips/dto/query.dto';
import { TripsService } from 'src/trips/trips.service';
import { UtilsService } from 'src/utils/utils.service';
import { TripDto } from './dto/trip.dto';
import { Trip } from './entities/trip.entity';

describe('TripsService', () => {
  let service: TripsService;
  let cachingService: CachingService;

  let prismaService: PrismaService;
  let axiosService: RequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        TripsService,
        PrismaService,
        CachingService,
        UtilsService,
        ConfigurationService,
        ConfigService,
        RequestService,
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    cachingService = module.get<CachingService>(CachingService);

    prismaService = module.get<PrismaService>(PrismaService);
    axiosService = module.get<RequestService>(RequestService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Get the trips' list", () => {
    it('Should return the chached list trip', async () => {
      const data: QueryDto = {
        origin: 'ATL',
        destination: 'MIA',
        sort_by: 'cost',
        sort_direction: 'asc',
      };
      const trips: Trip[] = [
        {
          id: '1',
          origin: 'ATL',
          destination: 'MIA',
          cost: 100,
          duration: 60,
          type: 'flight',
          display_name: 'ATL-MIA',
        },
        {
          id: '2',
          origin: 'ATL',
          destination: 'MIA',
          cost: 200,
          duration: 120,
          type: 'train',
          display_name: 'ATL-MIA',
        },
      ];
      cachingService.get = jest.fn().mockImplementation((): Trip[] => {
        return trips;
      });

      const result = await service.getTrips(data);

      expect(cachingService.get).toHaveBeenCalledTimes(1);

      expect(cachingService.get).toHaveBeenCalledWith(
        `trips:${data.origin}:${data.destination}:${data.sort_by}:${data.sort_direction}`,
      );

      expect(result.code).toBe(200);
      expect((result.data as successResponse).data).toEqual(trips);
    });

    it('Should return error when the 3rd Party API return a different status code from 200', async () => {
      const data: QueryDto = {
        origin: 'MIA',
        destination: 'MIA',
        sort_by: 'cost',
        sort_direction: 'asc',
      };

      cachingService.get = jest.fn().mockImplementation((): Trip[] => {
        return null;
      });

      axiosService.getAll = jest.fn().mockResolvedValueOnce({
        data: null,
        status: 500,
        statusText: 'Internal server error from the 3rd Party API',
      });

      cachingService.set = jest.fn().mockImplementation(() => {});

      const result = await service.getTrips(data);

      expect(axiosService.getAll).toHaveBeenCalledTimes(1);
      expect(axiosService.getAll).toHaveBeenCalledWith(
        data.destination,
        data.origin,
        'trips',
      );

      expect(result.code).toBe(500);
    });

    it('Should return an error if any exception is thrown', async () => {
      const data: QueryDto = {
        origin: 'MIA',
        destination: 'MIA',
        sort_by: 'cost',
        sort_direction: 'asc',
      };

      cachingService.get = jest.fn().mockImplementation(() => {
        throw new Error('Error in caching service Mocked');
      });

      const result = await service.getTrips(data);

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });

    describe('Cost sorting', () => {
      it('Should return the list ordered by cost in descendent way', async () => {
        const data: QueryDto = {
          origin: 'CAN',
          destination: 'BOM',
          sort_by: 'cost',
          sort_direction: 'desc',
        };

        const resultData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const fetchData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
        ];

        cachingService.get = jest.fn().mockImplementation((): Trip[] => {
          return null;
        });

        axiosService.getAll = jest.fn().mockResolvedValueOnce({
          data: fetchData,
          status: 200,
        });

        cachingService.set = jest.fn().mockImplementation(() => {});

        const result = await service.getTrips(data);

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(resultData);
      });

      it('Should return the list ordered by cost in ascendent way', async () => {
        const data: QueryDto = {
          origin: 'CAN',
          destination: 'BOM',
          sort_by: 'cost',
          sort_direction: 'asc',
        };

        const resultData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const fetchData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
        ];

        cachingService.get = jest.fn().mockImplementation((): Trip[] => {
          return null;
        });

        axiosService.getAll = jest.fn().mockResolvedValueOnce({
          data: fetchData,
          status: 200,
        });

        cachingService.set = jest.fn().mockImplementation(() => {});

        const result = await service.getTrips(data);

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(resultData);
      });
    });

    describe('Duration sorting', () => {
      it('Should return the list ordered by duration in descendent way', async () => {
        const data: QueryDto = {
          origin: 'CAN',
          destination: 'BOM',
          sort_by: 'fastest',
          sort_direction: 'desc',
        };
        const fetchData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const resultData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
        ];
        cachingService.get = jest.fn().mockImplementation((): Trip[] => {
          return null;
        });

        axiosService.getAll = jest.fn().mockResolvedValueOnce({
          data: fetchData,
          status: 200,
        });

        cachingService.set = jest.fn().mockImplementation(() => {});

        const result = await service.getTrips(data);

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(resultData);
      });

      it('Should return the list ordered by duration in ascendent way', async () => {
        const data: QueryDto = {
          origin: 'CAN',
          destination: 'BOM',
          sort_by: 'fastest',
          sort_direction: 'asc',
        };
        const fetchData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const resultData: Trip[] = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 6992,
            duration: 18,
            type: 'train',
            id: '6d1fbd55-70b3-4b69-9ae9-d29a1b7fdba9',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '523205f3-e1ca-45cb-830b-d432c99000db',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '084eb093-4651-40b6-839b-921eb8818ab6',
            display_name: 'from CAN to BOM by car',
          },
        ];

        cachingService.get = jest.fn().mockImplementation((): Trip[] => {
          return null;
        });

        axiosService.getAll = jest.fn().mockResolvedValueOnce({
          data: fetchData,
          status: 200,
        });

        cachingService.set = jest.fn().mockImplementation(() => {});

        const result = await service.getTrips(data);

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(resultData);
      });
    });
  });

  describe('Get one trip', () => {
    it('Should return the chached trip', async () => {
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      const cachedData: Trip = {
        origin: 'CAN',
        destination: 'BOM',
        cost: 812,
        duration: 13,
        type: 'train',
        id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
        display_name: 'from CAN to BOM by train',
      };

      cachingService.get = jest.fn().mockImplementation((): Trip => {
        return cachedData;
      });

      const result = await service.getTripById(data);

      expect(cachingService.get).toHaveBeenCalledTimes(1);

      expect(cachingService.get).toHaveBeenCalledWith(`trip:${data.id}`);

      expect(result.code).toBe(200);
      expect((result.data as successResponse).data).toEqual(cachedData);
    });

    it('Should return the trip if it is in the database', async () => {
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      const storedData: Trip = {
        origin: 'CAN',
        destination: 'BOM',
        cost: 812,
        duration: 13,
        type: 'train',
        id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
        display_name: 'from CAN to BOM by train',
      };

      cachingService.get = jest.fn().mockImplementation((): Trip => {
        return null;
      });

      prismaService.trips.findUnique = jest
        .fn()
        .mockResolvedValueOnce(storedData);

      const result = await service.getTripById(data);

      expect(cachingService.get).toHaveBeenCalledTimes(1);

      expect(prismaService.trips.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.trips.findUnique).toHaveBeenCalledWith({
        where: { id: data.id },
      });

      expect(result.code).toBe(200);
      expect((result.data as successResponse).data).toEqual(storedData);
    });

    it('Should return error when the 3rd Party API return a different status code from 200', async () => {
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };
      cachingService.get = jest.fn().mockImplementation((): Trip => {
        return null;
      });
      prismaService.trips.findUnique = jest.fn().mockResolvedValueOnce(null);

      axiosService.getById = jest.fn().mockResolvedValueOnce({
        data: null,
        status: 500,
        statusText: 'Internal server error from the 3rd Party API',
      });
      const result = await service.getTripById(data);

      expect(axiosService.getById).toHaveBeenCalledTimes(1);
      expect(axiosService.getById).toHaveBeenCalledWith(data.id, 'trips');

      expect(result.code).toBe(500);
    });

    it("Should return the fetched trip from the 3rd Party API if it isn't in the database", async () => {
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      const fetchData: Trip = {
        origin: 'CAN',
        destination: 'BOM',
        cost: 812,
        duration: 13,
        type: 'train',
        id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
        display_name: 'from CAN to BOM by train',
      };

      cachingService.get = jest.fn().mockImplementation((): Trip => {
        return null;
      });
      prismaService.trips.findUnique = jest.fn().mockResolvedValueOnce(null);
      axiosService.getById = jest.fn().mockResolvedValueOnce({
        data: fetchData,
        status: 200,
      });

      const result = await service.getTripById(data);

      expect(cachingService.get).toHaveBeenCalledTimes(1);

      expect(prismaService.trips.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.trips.findUnique).toHaveBeenCalledWith({
        where: { id: data.id },
      });

      expect(axiosService.getById).toHaveBeenCalledTimes(1);

      expect(axiosService.getById).toHaveBeenCalledWith(data.id, 'trips');

      expect(result.code).toBe(200);
      expect((result.data as successResponse).data).toEqual(fetchData);
    });
  });

  describe('Add a trip to the save list', () => {
    it('Should return an error if the user is not found', async () => {
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Prisma.PrismaClientKnownRequestError('User not found', {
            code: 'P2025',
            clientVersion: '2.20.0',
          });
        });

      const result = await service.addToSavedList({ id: null } as User, data);

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(result.code).toBe(404);
      expect(result.data.message).toBe('Not found.');
    });

    it('Should return an error if the trip is not in the database and fetching it from the 3rd Party API return a status code different from 200', async () => {
      const mockedUser = { id: 1 };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });
      prismaService.trips.findFirst = jest.fn().mockResolvedValueOnce(null);

      axiosService.getById = jest.fn().mockResolvedValueOnce({
        data: null,
        status: 500,
        statusText: 'Internal server error from the 3rd Party API',
      });

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(axiosService.getById).toHaveBeenCalledTimes(1);
      expect(axiosService.getById).toHaveBeenCalledWith(data.id, 'trips');

      expect(result.code).toBe(500);
    });

    it('Should return an error if the trip is not in the database and fetching it from the 3rd Party API, then when storing it in the database an error is thrown', async () => {
      const mockedUser = { id: 1 };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };
      const fetchData: Trip = {
        origin: 'CAN',
        destination: 'BOM',
        cost: 812,
        duration: 13,
        type: 'train',
        id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
        display_name: 'from CAN to BOM by train',
      };

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });
      prismaService.trips.findFirst = jest.fn().mockResolvedValueOnce(null);

      axiosService.getById = jest.fn().mockResolvedValueOnce({
        data: fetchData,
        status: 200,
        statusText: 'Internal server error from the 3rd Party API',
      });

      prismaService.trips.create = jest.fn().mockResolvedValueOnce(null);

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(axiosService.getById).toHaveBeenCalledTimes(1);
      expect(axiosService.getById).toHaveBeenCalledWith(data.id, 'trips');

      expect(prismaService.trips.create).toHaveBeenCalledTimes(1);
      expect(prismaService.trips.create).toHaveBeenCalledWith({
        data: {
          id: fetchData.id,
          origin: fetchData.origin,
          destination: fetchData.destination,
          cost: fetchData.cost,
          duration: fetchData.duration,
          type: fetchData.type,
          display_name: fetchData.display_name,
        },
      });

      expect(result.code).toBe(500);
    });

    it("Should return an error if the trip is not in the database and fetching it from the 3rd Party API, then when storing it in the user's save list an error is thrown", async () => {
      const mockedUser = { id: 1 };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };
      const fetchData: Trip = {
        origin: 'CAN',
        destination: 'BOM',
        cost: 812,
        duration: 13,
        type: 'train',
        id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
        display_name: 'from CAN to BOM by train',
      };

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });
      prismaService.trips.findFirst = jest.fn().mockResolvedValueOnce(null);

      axiosService.getById = jest.fn().mockResolvedValueOnce({
        data: fetchData,
        status: 200,
        statusText: 'Internal server error from the 3rd Party API',
      });

      prismaService.trips.create = jest.fn().mockResolvedValueOnce({ id: 1 });
      prismaService.lists.create = jest.fn().mockResolvedValueOnce(null);

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(axiosService.getById).toHaveBeenCalledTimes(1);
      expect(axiosService.getById).toHaveBeenCalledWith(data.id, 'trips');

      expect(prismaService.trips.create).toHaveBeenCalledTimes(1);
      expect(prismaService.trips.create).toHaveBeenCalledWith({
        data: {
          id: fetchData.id,
          origin: fetchData.origin,
          destination: fetchData.destination,
          cost: fetchData.cost,
          duration: fetchData.duration,
          type: fetchData.type,
          display_name: fetchData.display_name,
        },
      });

      expect(prismaService.lists.create).toHaveBeenCalledTimes(1);
      expect(prismaService.lists.create).toHaveBeenCalledWith({
        data: {
          id_user: mockedUser.id,
          id_trip: 1,
        },
      });

      expect(result.code).toBe(500);
    });

    it("Should return an error if the trip is in the database, then when storing it in the user's save list an error is thrown", async () => {
      const mockedUser = { id: 1 };
      const mockedTrip = { id: 1 };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });
      prismaService.trips.findFirst = jest
        .fn()
        .mockResolvedValueOnce(mockedTrip);

      prismaService.lists.create = jest.fn().mockResolvedValueOnce(null);

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(prismaService.lists.create).toHaveBeenCalledTimes(1);
      expect(prismaService.lists.create).toHaveBeenCalledWith({
        data: {
          id_user: mockedUser.id,
          id_trip: mockedTrip.id,
        },
      });

      expect(result.code).toBe(500);
    });

    it('Should return the adding confirmation when the trip is not in the database', async () => {
      const mockedUser = { id: 1 };
      const mockedTrip = { id: '2' };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };
      const fetchData: Trip = {
        origin: 'CAN',
        destination: 'BOM',
        cost: 812,
        duration: 13,
        type: 'train',
        id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778',
        display_name: 'from CAN to BOM by train',
      };

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });
      prismaService.trips.findFirst = jest.fn().mockResolvedValueOnce(null);

      axiosService.getById = jest.fn().mockResolvedValueOnce({
        data: fetchData,
        status: 200,
        statusText: 'Internal server error from the 3rd Party API',
      });

      prismaService.trips.create = jest.fn().mockResolvedValueOnce(mockedTrip);
      prismaService.lists.create = jest.fn().mockResolvedValueOnce({
        id_trip: mockedTrip.id,
        id_user: mockedUser.id,
        created_at: new Date(),
      } as Lists);

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(axiosService.getById).toHaveBeenCalledTimes(1);
      expect(axiosService.getById).toHaveBeenCalledWith(data.id, 'trips');

      expect(prismaService.trips.create).toHaveBeenCalledTimes(1);
      expect(prismaService.trips.create).toHaveBeenCalledWith({
        data: {
          id: fetchData.id,
          origin: fetchData.origin,
          destination: fetchData.destination,
          cost: fetchData.cost,
          duration: fetchData.duration,
          type: fetchData.type,
          display_name: fetchData.display_name,
        },
      });

      expect(prismaService.lists.create).toHaveBeenCalledTimes(1);
      expect(prismaService.lists.create).toHaveBeenCalledWith({
        data: {
          id_user: mockedUser.id,
          id_trip: mockedTrip.id,
        },
      });

      expect(result.code).toBe(201);
    });

    it('Should return the adding confirmation when the trip is in the database', async () => {
      const mockedUser = { id: 1 };
      const mockedTrip = { id: '2' };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });
      prismaService.trips.findFirst = jest
        .fn()
        .mockResolvedValueOnce(mockedTrip);

      prismaService.lists.create = jest.fn().mockResolvedValueOnce({
        id_trip: mockedTrip.id,
        id_user: mockedUser.id,
        created_at: new Date(),
      } as Lists);

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(prismaService.lists.create).toHaveBeenCalledTimes(1);
      expect(prismaService.lists.create).toHaveBeenCalledWith({
        data: {
          id_user: mockedUser.id,
          id_trip: mockedTrip.id,
        },
      });

      expect(result.code).toBe(201);
    });

    it('Should return an error if any exception is thrown', async () => {
      const mockedUser = { id: 1 };
      const data: TripDto = { id: 'b99b48bf-8c06-4fa4-bbad-5d5908431778' };

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Error in prisma service mocked');
        });

      const result = await service.addToSavedList(mockedUser as User, data);

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });
  });

  describe('Get the save list', () => {
    it('Should return an error if the user is not found', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedPagination: PaginationQueryDto = {
        limit: 10,
        page: 1,
        sort: 'cost',
        sorted_by: 'asc',
      };
      const mockeRoute = '/saved-list';

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Prisma.PrismaClientKnownRequestError('User not found', {
            code: 'P2025',
            clientVersion: '2.20.0',
          });
        });

      const result = await service.getSavedList(
        mockedUser,
        mockedPagination,
        mockeRoute,
      );

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(result.code).toBe(404);
      expect(result.data.message).toBe('Not found.');
    });

    it("Should return an empty saved list if the user doesn't have any trip saved", async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedPagination: PaginationQueryDto = {
        limit: 10,
        page: 1,
        sort: 'cost',
        sorted_by: 'asc',
      };
      const mockeRoute = '/saved-list';

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });

      prismaService.lists.findMany = jest.fn().mockResolvedValueOnce([]);

      const result = await service.getSavedList(
        mockedUser,
        mockedPagination,
        mockeRoute,
      );

      expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.lists.findMany).toHaveBeenCalledWith({
        where: { id_user: mockedUser.id },
        select: { created_at: true, id_trip: true },
      });

      expect(result.code).toBe(200);
      expect((result.data as successResponse).data).toEqual([]);
    });

    describe('Cost sorting', () => {
      it('Should return the list ordered by cost in descendent way', async () => {
        const mockedUser: User = { id: 1, username: 'test' };
        const mockedPagination: PaginationQueryDto = {
          limit: 10,
          page: 1,
          sort: 'desc',
          sorted_by: 'cheapest',
        };
        const mockeRoute = '/saved-list';

        const listData = [
          {
            id_user: 1,
            id_trip: '1',
            created_at: '2024-11-24 10:18:52.239',
          },
          {
            id_user: 1,
            id_trip: '2',
            created_at: '2024-11-23 12:58:45.304',
          },
          {
            id_user: 1,
            id_trip: '3',
            created_at: '2024-11-24 11:55:49.135',
          },
        ];

        const tripsData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const testData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
            added_date: '2024-11-24 11:55:49.135',
          },

          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            added_date: '2024-11-23 12:58:45.304',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            added_date: '2024-11-24 10:18:52.239',
            display_name: 'from CAN to BOM by train',
          },
        ];
        prismaService.users.findUniqueOrThrow = jest
          .fn()
          .mockResolvedValueOnce({
            id: mockedUser.id,
          });

        prismaService.lists.findMany = jest
          .fn()
          .mockResolvedValueOnce(listData);

        prismaService.trips.findMany = jest
          .fn()
          .mockResolvedValueOnce(tripsData);

        const result = await service.getSavedList(
          mockedUser,
          mockedPagination,
          mockeRoute,
        );

        expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.lists.findMany).toHaveBeenCalledWith({
          where: { id_user: mockedUser.id },
          select: { created_at: true, id_trip: true },
        });

        expect(prismaService.trips.findMany).toHaveBeenCalledTimes(1);

        expect(prismaService.trips.findMany).toHaveBeenCalledWith({
          where: { id: { in: listData.map((i) => i.id_trip) } },
        });

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(testData);
      });

      it('Should return the list ordered by cost in ascendent way', async () => {
        const mockedUser: User = { id: 1, username: 'test' };
        const mockedPagination: PaginationQueryDto = {
          limit: 10,
          page: 1,
          sort: 'asc',
          sorted_by: 'cheapest',
        };
        const mockeRoute = '/saved-list';

        const listData = [
          {
            id_user: 1,
            id_trip: '1',
            created_at: '2024-11-24 10:18:52.239',
          },
          {
            id_user: 1,
            id_trip: '2',
            created_at: '2024-11-23 12:58:45.304',
          },
          {
            id_user: 1,
            id_trip: '3',
            created_at: '2024-11-24 11:55:49.135',
          },
        ];

        const tripsData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const testData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            added_date: '2024-11-24 10:18:52.239',
            display_name: 'from CAN to BOM by train',
          },

          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            added_date: '2024-11-23 12:58:45.304',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
            added_date: '2024-11-24 11:55:49.135',
          },
        ];

        prismaService.users.findUniqueOrThrow = jest
          .fn()
          .mockResolvedValueOnce({
            id: mockedUser.id,
          });

        prismaService.lists.findMany = jest
          .fn()
          .mockResolvedValueOnce(listData);

        prismaService.trips.findMany = jest
          .fn()
          .mockResolvedValueOnce(tripsData);

        const result = await service.getSavedList(
          mockedUser,
          mockedPagination,
          mockeRoute,
        );

        expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.lists.findMany).toHaveBeenCalledWith({
          where: { id_user: mockedUser.id },
          select: { created_at: true, id_trip: true },
        });

        expect(prismaService.trips.findMany).toHaveBeenCalledTimes(1);

        expect(prismaService.trips.findMany).toHaveBeenCalledWith({
          where: { id: { in: listData.map((i) => i.id_trip) } },
        });

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(testData);
      });
    });

    describe('Duration sorting', () => {
      it('Should return the list ordered by duration in descendent way', async () => {
        const mockedUser: User = { id: 1, username: 'test' };
        const mockedPagination: PaginationQueryDto = {
          limit: 10,
          page: 1,
          sort: 'desc',
          sorted_by: 'fastest',
        };
        const mockeRoute = '/saved-list';

        const listData = [
          {
            id_user: 1,
            id_trip: '1',
            created_at: '2024-11-24 10:18:52.239',
          },
          {
            id_user: 1,
            id_trip: '2',
            created_at: '2024-11-23 12:58:45.304',
          },
          {
            id_user: 1,
            id_trip: '3',
            created_at: '2024-11-24 11:55:49.135',
          },
        ];

        const tripsData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const testData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            added_date: '2024-11-23 12:58:45.304',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
            added_date: '2024-11-24 11:55:49.135',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            added_date: '2024-11-24 10:18:52.239',
            display_name: 'from CAN to BOM by train',
          },
        ];

        prismaService.users.findUniqueOrThrow = jest
          .fn()
          .mockResolvedValueOnce({
            id: mockedUser.id,
          });

        prismaService.lists.findMany = jest
          .fn()
          .mockResolvedValueOnce(listData);

        prismaService.trips.findMany = jest
          .fn()
          .mockResolvedValueOnce(tripsData);

        const result = await service.getSavedList(
          mockedUser,
          mockedPagination,
          mockeRoute,
        );

        expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.lists.findMany).toHaveBeenCalledWith({
          where: { id_user: mockedUser.id },
          select: { created_at: true, id_trip: true },
        });

        expect(prismaService.trips.findMany).toHaveBeenCalledTimes(1);

        expect(prismaService.trips.findMany).toHaveBeenCalledWith({
          where: { id: { in: listData.map((i) => i.id_trip) } },
        });

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(testData);
      });

      it('Should return the list ordered by duration in ascendent way', async () => {
        const mockedUser: User = { id: 1, username: 'test' };
        const mockedPagination: PaginationQueryDto = {
          limit: 10,
          page: 1,
          sort: 'asc',
          sorted_by: 'fastest',
        };
        const mockeRoute = '/saved-list';

        const listData = [
          {
            id_user: 1,
            id_trip: '1',
            created_at: '2024-11-24 10:18:52.239',
          },
          {
            id_user: 1,
            id_trip: '2',
            created_at: '2024-11-23 12:58:45.304',
          },
          {
            id_user: 1,
            id_trip: '3',
            created_at: '2024-11-24 11:55:49.135',
          },
        ];

        const tripsData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const testData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            added_date: '2024-11-24 10:18:52.239',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
            added_date: '2024-11-24 11:55:49.135',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            added_date: '2024-11-23 12:58:45.304',
            display_name: 'from CAN to BOM by car',
          },
        ];

        prismaService.users.findUniqueOrThrow = jest
          .fn()
          .mockResolvedValueOnce({
            id: mockedUser.id,
          });

        prismaService.lists.findMany = jest
          .fn()
          .mockResolvedValueOnce(listData);

        prismaService.trips.findMany = jest
          .fn()
          .mockResolvedValueOnce(tripsData);

        const result = await service.getSavedList(
          mockedUser,
          mockedPagination,
          mockeRoute,
        );

        expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.lists.findMany).toHaveBeenCalledWith({
          where: { id_user: mockedUser.id },
          select: { created_at: true, id_trip: true },
        });

        expect(prismaService.trips.findMany).toHaveBeenCalledTimes(1);

        expect(prismaService.trips.findMany).toHaveBeenCalledWith({
          where: { id: { in: listData.map((i) => i.id_trip) } },
        });

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(testData);
      });
    });

    describe('Date sorting', () => {
      it('Should return the list ordered by newest added date', async () => {
        const mockedUser: User = { id: 1, username: 'test' };
        const mockedPagination: PaginationQueryDto = {
          limit: 10,
          page: 1,
          sort: 'asc',
          sorted_by: 'newest',
        };
        const mockeRoute = '/saved-list';

        const listData = [
          {
            id_user: 1,
            id_trip: '1',
            created_at: '2024-11-24 10:18:52.239',
          },
          {
            id_user: 1,
            id_trip: '2',
            created_at: '2024-11-23 12:58:45.304',
          },
          {
            id_user: 1,
            id_trip: '3',
            created_at: '2024-11-24 11:55:49.135',
          },
        ];

        const tripsData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const testData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            added_date: '2024-11-24 10:18:52.239',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
            added_date: '2024-11-24 11:55:49.135',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            added_date: '2024-11-23 12:58:45.304',
            display_name: 'from CAN to BOM by car',
          },
        ];

        prismaService.users.findUniqueOrThrow = jest
          .fn()
          .mockResolvedValueOnce({
            id: mockedUser.id,
          });

        prismaService.lists.findMany = jest
          .fn()
          .mockResolvedValueOnce(listData);

        prismaService.trips.findMany = jest
          .fn()
          .mockResolvedValueOnce(tripsData);

        const result = await service.getSavedList(
          mockedUser,
          mockedPagination,
          mockeRoute,
        );

        expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.lists.findMany).toHaveBeenCalledWith({
          where: { id_user: mockedUser.id },
          select: { created_at: true, id_trip: true },
        });

        expect(prismaService.trips.findMany).toHaveBeenCalledTimes(1);

        expect(prismaService.trips.findMany).toHaveBeenCalledWith({
          where: { id: { in: listData.map((i) => i.id_trip) } },
        });

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(testData);
      });

      it('Should return the list ordered by oldest added date', async () => {
        const mockedUser: User = { id: 1, username: 'test' };
        const mockedPagination: PaginationQueryDto = {
          limit: 10,
          page: 1,
          sort: 'asc',
          sorted_by: 'oldest',
        };
        const mockeRoute = '/saved-list';

        const listData = [
          {
            id_user: 1,
            id_trip: '1',
            created_at: '2024-11-24 10:18:52.239',
          },
          {
            id_user: 1,
            id_trip: '2',
            created_at: '2024-11-23 12:58:45.304',
          },
          {
            id_user: 1,
            id_trip: '3',
            created_at: '2024-11-24 11:55:49.135',
          },
        ];

        const tripsData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            display_name: 'from CAN to BOM by train',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
          },
        ];

        const testData = [
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 3882,
            duration: 46,
            type: 'car',
            id: '2',
            added_date: '2024-11-23 12:58:45.304',
            display_name: 'from CAN to BOM by car',
          },
          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 812,
            duration: 13,
            type: 'train',
            id: '1',
            added_date: '2024-11-24 10:18:52.239',
            display_name: 'from CAN to BOM by train',
          },

          {
            origin: 'CAN',
            destination: 'BOM',
            cost: 4231,
            duration: 28,
            type: 'train',
            id: '3',
            display_name: 'from CAN to BOM by train',
            added_date: '2024-11-24 11:55:49.135',
          },
        ];

        prismaService.users.findUniqueOrThrow = jest
          .fn()
          .mockResolvedValueOnce({
            id: mockedUser.id,
          });

        prismaService.lists.findMany = jest
          .fn()
          .mockResolvedValueOnce(listData);

        prismaService.trips.findMany = jest
          .fn()
          .mockResolvedValueOnce(tripsData);

        const result = await service.getSavedList(
          mockedUser,
          mockedPagination,
          mockeRoute,
        );

        expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
        expect(prismaService.lists.findMany).toHaveBeenCalledWith({
          where: { id_user: mockedUser.id },
          select: { created_at: true, id_trip: true },
        });

        expect(prismaService.trips.findMany).toHaveBeenCalledTimes(1);

        expect(prismaService.trips.findMany).toHaveBeenCalledWith({
          where: { id: { in: listData.map((i) => i.id_trip) } },
        });

        expect(result.code).toBe(200);
        expect((result.data as successResponse).data).toEqual(testData);
      });
    });

    it('Should return an error if any exception is thrown', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedPagination: PaginationQueryDto = {
        limit: 10,
        page: 1,
        sort: 'cost',
        sorted_by: 'asc',
      };
      const mockeRoute = '/saved-list';

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Error in prisma service mocked');
        });

      const result = await service.getSavedList(
        mockedUser,
        mockedPagination,
        mockeRoute,
      );

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });
  });

  describe('Delete a trip from the save list', () => {
    it('Should return an error if the user is not found', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedTrip = '1';

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Prisma.PrismaClientKnownRequestError('User not found', {
            code: 'P2025',
            clientVersion: '2.20.0',
          });
        });

      const result = await service.removeFromSavedList(mockedUser, mockedTrip);

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(result.code).toBe(404);
      expect(result.data.message).toBe('Not found.');
    });

    it("Should return an error if the trip is not found in the user's save list", async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedTrip = '1';

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });

      prismaService.lists.findFirst = jest.fn().mockResolvedValueOnce(null);

      const result = await service.removeFromSavedList(mockedUser, mockedTrip);

      expect(prismaService.lists.findFirst).toHaveBeenCalledTimes(1);

      expect(result.code).toBe(404);
      expect(result.data.message).toBe('Not found.');
    });

    it('Should return an error if any exception is thrown', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedTrip = '1';

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Error in prisma service mocked');
        });

      const result = await service.removeFromSavedList(mockedUser, mockedTrip);

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });

    it('Should return the confirmation for deleting the trip', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const mockedTrip = '1';

      prismaService.users.findUniqueOrThrow = jest.fn().mockResolvedValueOnce({
        id: mockedUser.id,
      });

      prismaService.lists.findFirst = jest.fn().mockResolvedValueOnce({
        id_trip: mockedTrip,
        id_user: mockedUser.id,
        created_at: new Date(),
      } as Lists);

      prismaService.lists.delete = jest.fn();

      const result = await service.removeFromSavedList(mockedUser, mockedTrip);

      expect(prismaService.lists.findFirst).toHaveBeenCalledTimes(1);

      expect(prismaService.lists.delete).toHaveBeenCalledTimes(1);

      expect(prismaService.lists.delete).toHaveBeenCalledWith({
        where: {
          id_trip_id_user: { id_trip: mockedTrip, id_user: mockedUser.id },
        },
      });

      expect(result.code).toBe(204);
    });
  });

  describe('Export the save list ', () => {
    it('Should return an error if the user is not found', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const typeQuery: ExportQueryParamsDto = { type: 'csv' };
      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Prisma.PrismaClientKnownRequestError('User not found', {
            code: 'P2025',
            clientVersion: '2.20.0',
          });
        });

      const result = await service.exportList(mockedUser, typeQuery);

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect((result as { data: errorResponse; code: number }).code).toBe(404);
      expect(
        (result as { data: errorResponse; code: number }).data.message,
      ).toBe('Not found.');
    });
    it('Should return an error if any exception is thrown', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const typeQuery: ExportQueryParamsDto = { type: 'csv' };
      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Error in prisma service mocked');
        });

      const result = await service.exportList(mockedUser, typeQuery);

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);

      expect((result as { data: errorResponse; code: number }).code).toBe(500);
    });

    it("Should return an empty list if the user doesn't have any trip saved", async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const typeQuery: ExportQueryParamsDto = { type: 'csv' };
      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockReturnValueOnce(mockedUser);

      prismaService.lists.findMany = jest.fn().mockReturnValueOnce([]);

      const result = await service.exportList(mockedUser, typeQuery);

      expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);

      expect((result as { data: successResponse; code: number }).code).toBe(
        200,
      );
      expect(
        (result as { data: successResponse; code: number }).data.data,
      ).toEqual([]);
    });

    it('Should return a csv file if the user has trips saved and select exports to csv', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const typeQuery: ExportQueryParamsDto = { type: 'csv' };

      const listData = [
        {
          id_user: 1,
          id_trip: '1',
          created_at: '2024-11-24 10:18:52.239',
        },
        {
          id_user: 1,
          id_trip: '2',
          created_at: '2024-11-23 12:58:45.304',
        },
        {
          id_user: 1,
          id_trip: '3',
          created_at: '2024-11-24 11:55:49.135',
        },
      ];

      const tripsData = [
        {
          origin: 'CAN',
          destination: 'BOM',
          cost: 812,
          duration: 13,
          type: 'train',
          id: '1',
          display_name: 'from CAN to BOM by train',
        },
        {
          origin: 'CAN',
          destination: 'BOM',
          cost: 3882,
          duration: 46,
          type: 'car',
          id: '2',
          display_name: 'from CAN to BOM by car',
        },
        {
          origin: 'CAN',
          destination: 'BOM',
          cost: 4231,
          duration: 28,
          type: 'train',
          id: '3',
          display_name: 'from CAN to BOM by train',
        },
      ];
      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockResolvedValueOnce(mockedUser);

      prismaService.lists.findMany = jest.fn().mockResolvedValueOnce(listData);

      prismaService.trips.findMany = jest.fn().mockResolvedValueOnce(tripsData);

      const result = await service.exportList(mockedUser, typeQuery);

      expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
    });

    it('Should return a json file if the user has trips saved and select exports to json', async () => {
      const mockedUser: User = { id: 1, username: 'test' };
      const typeQuery: ExportQueryParamsDto = { type: 'json' };

      const listData = [
        {
          id_user: 1,
          id_trip: '1',
          created_at: '2024-11-24 10:18:52.239',
        },
        {
          id_user: 1,
          id_trip: '2',
          created_at: '2024-11-23 12:58:45.304',
        },
        {
          id_user: 1,
          id_trip: '3',
          created_at: '2024-11-24 11:55:49.135',
        },
      ];

      const tripsData = [
        {
          origin: 'CAN',
          destination: 'BOM',
          cost: 812,
          duration: 13,
          type: 'train',
          id: '1',
          display_name: 'from CAN to BOM by train',
        },
        {
          origin: 'CAN',
          destination: 'BOM',
          cost: 3882,
          duration: 46,
          type: 'car',
          id: '2',
          display_name: 'from CAN to BOM by car',
        },
        {
          origin: 'CAN',
          destination: 'BOM',
          cost: 4231,
          duration: 28,
          type: 'train',
          id: '3',
          display_name: 'from CAN to BOM by train',
        },
      ];

      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockResolvedValueOnce(mockedUser);

      prismaService.lists.findMany = jest.fn().mockResolvedValueOnce(listData);

      prismaService.trips.findMany = jest.fn().mockResolvedValueOnce(tripsData);

      const result = await service.exportList(mockedUser, typeQuery);

      expect(prismaService.lists.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
