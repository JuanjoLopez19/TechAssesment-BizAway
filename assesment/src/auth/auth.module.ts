import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: async (config: ConfigurationService) => {
        return {
          secret: config.crypto.jwtSecret,
          signOptions: { expiresIn: config.crypto.jwtExpiresIn },
        };
      },
      inject: [ConfigurationService],
    }),
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('auth/register');
  }
}
