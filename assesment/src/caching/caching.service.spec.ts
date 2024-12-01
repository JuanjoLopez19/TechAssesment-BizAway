import { Test, TestingModule } from '@nestjs/testing';
import { CachingService } from 'src/caching/caching.service';
import { TestModule } from 'src/test/utils/test.module';
import { ConfigurationService } from 'src/configuration/configuration.service';

describe('CachingService', () => {
  let service: CachingService;
  let configurationService: ConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      providers: [CachingService, ConfigurationService],
    }).compile();

    service = module.get<CachingService>(CachingService);
    configurationService =
      module.get<ConfigurationService>(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should get a pong from the redis server', async () => {
    const res = await service.checkConnection();
    expect(res).toBe(true);
  });

  it('Should set the key with the given value', async () => {
    const key = 'test';
    const value = 'value';
    await service.set(key, value);
    const response = await service.get(key);
    expect(response).toBe(value);
  });

  it('Should set the key and then delete it', async () => {
    const key = 'key';
    const value = 'value';

    await service.set(key, value);

    const response = await service.get(key);

    expect(response).toBe(value);

    await service.delete(key);

    const deleted = await service.get(key);

    expect(deleted).toBe(null);
  });
});
