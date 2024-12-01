import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { loggingMiddleware, PrismaModule } from 'nestjs-prisma';
import { ConfigurationModule } from './configuration/configuration.module';
import { AppLoggerMiddleware } from './middleware/http.middleware';
import { TripsModule } from './trips/trips.module';
import { AuthModule } from './auth/auth.module';
import { CachingModule } from './caching/caching.module';
import { RequestModule } from './request/request.module';

@Module({
  imports: [
    UtilsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          middlewares: [
            loggingMiddleware({
              logger: new Logger('PrismaMiddleware', {
                timestamp: true,
              }),
              logLevel: 'debug',
            }),
          ],
          prismaOptions: { log: ['warn', 'error'] },
        };
      },
    }),
    ConfigurationModule,
    TripsModule,
    AuthModule,
    CachingModule,
    RequestModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
