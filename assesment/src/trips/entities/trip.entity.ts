import { ApiProperty } from '@nestjs/swagger';
import { Trips } from '@prisma/client';
import { Entity } from 'src/common/entity';

// Trip entity
export class Trip implements Trips {
  @ApiProperty()
  id: string;
  @ApiProperty()
  origin: string;
  @ApiProperty()
  destination: string;
  @ApiProperty()
  cost: number;
  @ApiProperty()
  duration: number;
  @ApiProperty()
  type: string;
  @ApiProperty()
  display_name: string;
}

// Added trip entity
export class TripsList extends Trip {
  @ApiProperty({ description: 'Added date of the trip' })
  created_at: Date;
}

// Multiple added trips list response
export class TripsListResponse extends Entity<TripsList[]> {
  @ApiProperty({ type: [TripsList] })
  declare data: TripsList[];
}

export class SuccessResponseTripsList {
  @ApiProperty({ type: TripsListResponse })
  data: TripsListResponse;

  @ApiProperty()
  code: number;
}

// Multiple trips response
export class TripsResponse extends Entity<Trip[]> {
  @ApiProperty({ type: [Trip] })
  declare data: Trip[];
}

export class SuccessResponseTrips {
  @ApiProperty({ type: TripsResponse })
  data: TripsResponse;

  @ApiProperty()
  code: number;
}

// Single trip response
export class TripResponse extends Entity<Trip> {
  @ApiProperty({ type: Trip })
  declare data: Trip;
}

export class SuccessResponseTrip {
  @ApiProperty({ type: TripResponse })
  data: TripResponse;

  @ApiProperty()
  code: number;
}
