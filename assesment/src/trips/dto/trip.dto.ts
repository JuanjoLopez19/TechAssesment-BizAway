import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TripDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The id of the trip to check out',
    type: 'string',
  })
  id: string;
}
