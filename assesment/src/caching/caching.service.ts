import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigurationService } from 'src/configuration/configuration.service';

@Injectable()
export class CachingService {
  private readonly client: Redis;
  private readonly logger = new Logger(CachingService.name);

  constructor(private readonly config: ConfigurationService) {
    this.client = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
    });

    this.logger.log('Redis connected');
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.config.redis.ttl,
  ): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}