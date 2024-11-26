import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  appOptions,
  cryptoOptions,
  httpOption,
  redisOptions,
} from 'src/common/types';

@Injectable()
export class ConfigurationService {
  public http: httpOption;
  public app: appOptions;
  public crypto: cryptoOptions;
  public redis: redisOptions;

  constructor(private readonly config: ConfigService) {
    this.http = {
      httpPort: parseInt(this.config.get('HTTP_PORT') ?? '3000'),
      httpsPort: parseInt(this.config.get('HTTPS_PORT') ?? '3001'),
      httpsHostPort: parseInt(this.config.get('HTTPS_HOST_PORT') ?? '443'),
    };

    this.app = {
      name: this.config.get('APP_NAME') ?? 'assessment',
      apiUrl: this.config.get('API_URL') ?? 'http://localhost:3000',
      apiToken: this.config.get('API_TOKEN') ?? '123456',
      apiPath: this.config.get('API_PATH') ?? '/api',
    };

    this.crypto = {
      jwtSecret: this.config.get('JWT_SECRET') ?? 'secret',
      jwtExpiresIn: this.config.get('JWT_EXPIRES_IN') ?? '1h',
      saltRounds: parseInt(this.config.get('SALT_ROUNDS') ?? '10'),
      cookieName: this.config.get('COOKIE_NAME') ?? 'jwt',
    };

    this.redis = {
      host: this.config.get('REDIS_HOST') ?? 'localhost',
      port: parseInt(this.config.get('REDIS_PORT') ?? '6379'),
      password: this.config.get('REDIS_PASSWORD') ?? '',
      ttl: parseInt(this.config.get('REDIS_TTL') ?? '360'),
    };
  }
}
