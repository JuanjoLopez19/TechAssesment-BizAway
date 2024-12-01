import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { ConfigService } from '@nestjs/config';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let mockConfigService: ConfigService;

  beforeEach(async () => {
    // Mock implementation of ConfigService
    const mockConfigServiceValue = {
      get: jest.fn((key: string) => {
        const configMap: Record<string, string> = {
          HTTP_PORT: '3000',
          HTTPS_PORT: '3001',
          HTTPS_HOST_PORT: '443',
          APP_NAME: 'test-app',
          API_URL: 'http://test-url',
          API_TOKEN: 'test-token',
          API_PATH: '/test-api',
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '2h',
          SALT_ROUNDS: '12',
          COOKIE_NAME: 'test-cookie',
          REDIS_HOST: 'test-redis-host',
          REDIS_PORT: '6380',
          REDIS_PASSWORD: 'test-password',
          REDIS_TTL: '720',
        };
        return configMap[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: ConfigService,
          useValue: mockConfigServiceValue,
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
    mockConfigService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Http configuration', () => {
    it('should initialize http options correctly', () => {
      expect(service.http).toEqual({
        httpPort: 3000,
        httpsPort: 3001,
        httpsHostPort: 443,
      });
    });
  });

  describe('App configuration', () => {
    it('should initialize app options correctly', () => {
      expect(service.app).toEqual({
        name: 'test-app',
        apiUrl: 'http://test-url',
        apiToken: 'test-token',
        apiPath: '/test-api',
      });
    });
  });

  describe('Crypto configuration', () => {
    it('should initialize crypto options correctly', () => {
      expect(service.crypto).toEqual({
        jwtSecret: 'test-secret',
        jwtExpiresIn: '2h',
        saltRounds: 12,
        cookieName: 'test-cookie',
      });
    });
  });

  describe('Redis configuration', () => {
    it('should initialize redis options correctly', () => {
      expect(service.redis).toEqual({
        host: 'test-redis-host',
        port: 6380,
        password: 'test-password',
        ttl: 720,
      });
    });
  });

  it('should use default values when environment variables are not set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const defaultService =
      module.get<ConfigurationService>(ConfigurationService);

    expect(defaultService.http).toEqual({
      httpPort: 3000,
      httpsPort: 3001,
      httpsHostPort: 443,
    });

    expect(defaultService.app).toEqual({
      name: 'assessment',
      apiUrl: 'http://localhost:3000',
      apiToken: '123456',
      apiPath: '/api',
    });

    expect(defaultService.crypto).toEqual({
      jwtSecret: 'secret',
      jwtExpiresIn: '1h',
      saltRounds: 10,
      cookieName: 'jwt',
    });

    expect(defaultService.redis).toEqual({
      host: 'localhost',
      port: 6379,
      password: '',
      ttl: 360,
    });
  });
});
