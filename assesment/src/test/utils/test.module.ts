import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'nestjs-prisma';
import { AuthModule } from 'src/auth/auth.module';
import { CachingModule } from 'src/caching/caching.module';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    UtilsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          middlewares: [],
          prismaOptions: { log: ['warn', 'error'] },
        };
      },
    }),
    ConfigurationModule,
    CachingModule,
    JwtModule,
    AuthModule,
  ],
})
export class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Omitir middlewares que no sean esenciales para las pruebas
  }
}
