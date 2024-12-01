import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { successResponse } from 'src/common/types';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { UtilsService } from 'src/utils/utils.service';
import { hashRegEx } from 'src/test/utils/const';
import { TestModule } from 'src/test/utils/test.module';

jest.useFakeTimers();

describe('UtilsService', () => {
  let service: UtilsService;
  let configurationService: ConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      providers: [UtilsService, ConfigurationService],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
    configurationService =
      module.get<ConfigurationService>(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should return an error response object with the given error code, the given message and the detailed error message', () => {
    const error = 'error code';
    const message = 'message';
    const detail = 'detail';
    const response = service.buildErrorResponse(error, message, detail);

    expect(response.error).toBe(error);
    expect(response.message).toBe(message);
    expect(response.detail).toBe(detail);
  });

  it('buildSuccessResponse should return a success response without links', () => {
    const successResponse = service.buildSuccessResponse(
      { data: 'test' },
      'Success message',
    );
    expect(successResponse).toEqual({
      data: { data: 'test' },
      message: 'Success message',
    });
  });

  it('buildSuccessResponse should return a success response with links', () => {
    const successResponse: successResponse = service.buildSuccessResponse(
      { data: 'test' },
      'Success message',
      {
        self: 'link',
        first: 'link',
        prev: 'link',
        next: 'link',
        last: 'link',
        totalPages: 5,
      },
    );
    expect(successResponse).toEqual({
      data: { data: 'test' },
      message: 'Success message',
      links: {
        self: 'link',
        first: 'link',
        prev: 'link',
        next: 'link',
        last: 'link',
        totalPages: 5,
      },
    });
  });

  it('buildPaginationLinks should return pagination links', () => {
    const links = service.buildPaginationLinks('route', 2, 10, 5);
    expect(links).toEqual({
      self: 'route?page=2&limit=10',
      first: 'route?page=1&limit=10',
      prev: 'route?page=1&limit=10',
      next: 'route?page=3&limit=10',
      last: 'route?page=5&limit=10',
      totalPages: 5,
    });
  });

  it('buildPaginationLinks should handle the case where there is no previous page', () => {
    const links = service.buildPaginationLinks('route', 1, 10, 5);
    expect(links.prev).toBeNull();
  });

  it('buildPaginationLinks should handle the case where there is no next page', () => {
    const links = service.buildPaginationLinks('route', 5, 10, 5);
    expect(links.next).toBeNull();
  });

  it('encryptPassword should encrypt a password (NO MOCK)', async () => {
    const password = 'testPassword';

    const result = await service.encryptPassword(password);
    expect(result).not.toBe(password);
    expect(hashRegEx.test(result)).toBe(true);
  });

  it('encryptPassword should encrypt a password (MOCK)', async () => {
    const mockSalt = 'mockSalt';
    const mockHash = 'mockHash';

    const mockGenSalt = jest
      .spyOn(bcrypt, 'genSalt')
      .mockResolvedValue(mockSalt as never);

    const mockHashFunction = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue(mockHash as never);

    const result = await service.encryptPassword('testPassword');

    expect(mockGenSalt).toHaveBeenCalledWith(
      configurationService.crypto.saltRounds,
    );
    expect(mockHashFunction).toHaveBeenCalledWith('testPassword', mockSalt);

    // Verificamos el resultado
    expect(result).toBe(mockHash);

    jest.restoreAllMocks();
  });

  it('encryptPassword should return null if an error occurs during encryption', async () => {
    const password = 'testPassword';
    const error = new Error('Error generating salt');

    const mockGenSalt = jest
      .spyOn(bcrypt, 'genSalt')
      .mockRejectedValue(error as never);

    const result = await service.encryptPassword(password);

    expect(result).toBeNull();

    expect(mockGenSalt).toHaveBeenCalledWith(
      configurationService.crypto.saltRounds,
    );

    jest.restoreAllMocks();
  });

  it('Compare if the given password is the same has the hashed one', async () => {
    const password = 'testPassword';
    const hashedPassword = 'hashedPassword';

    const mockedCompare = jest
      .spyOn(bcrypt, 'compare')
      .mockResolvedValue(true as never);
    const result = await service.comparePwd(password, hashedPassword);

    expect(result).toBe(true);

    expect(mockedCompare).toHaveBeenCalledWith(password, hashedPassword);

    jest.restoreAllMocks();
  });

  it('keysChecker should return true if all keys exist and are valid', () => {
    const obj = { key1: 'value1', key2: 'value2' };
    const keys = ['key1', 'key2'];

    const result = service.keysChecker(obj, keys);

    expect(result).toBe(true);
  });

  it('keysChecker should return false if some keys are missing or invalid', () => {
    const obj = { key1: 'value1' };
    const keys = ['key1', 'key2'];

    const result = service.keysChecker(obj, keys);

    expect(result).toBe(false);
  });
});
