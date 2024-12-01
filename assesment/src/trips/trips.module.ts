import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { CachingModule } from 'src/caching/caching.module';
import { RequestModule } from 'src/request/request.module';

@Module({
  controllers: [TripsController],
  providers: [TripsService],
  imports: [CachingModule, RequestModule],
})
export class TripsModule {}
