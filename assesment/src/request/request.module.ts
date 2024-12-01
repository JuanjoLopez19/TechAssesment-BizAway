import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RequestService } from './request.service';
import { ConfigurationService } from 'src/configuration/configuration.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configuration: ConfigurationService) => {
        return {
          baseURL: configuration.app.apiUrl,
          headers: {
            'x-api-key': configuration.app.apiToken,
          },
        };
      },
      inject: [ConfigurationService],
    }),
  ],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
