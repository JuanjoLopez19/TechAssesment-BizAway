import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { CachingModule } from 'src/caching/caching.module';

@Module({
  controllers: [TripsController],
  providers: [TripsService],
  imports: [CachingModule],
})
export class TripsModule {}
