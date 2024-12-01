import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Validate } from 'class-validator';
import {
  ALLOWED_DIRECTION_SORTING,
  ALLOWED_EXPORT_TYPES,
  ALLOWED_QUERY_SORTING,
  ALLOWED_TAGS,
} from 'src/common/const';

export class QueryDto {
  @IsIn(ALLOWED_TAGS)
  @IsString()
  @Validate((value: string) => value.length === 3)
  @ApiProperty({ enum: ALLOWED_TAGS, description: 'The origin of the trip' })
  origin: string;

  @IsIn(ALLOWED_TAGS)
  @Validate((value: string) => value.length === 3)
  @IsString()
  @ApiProperty({
    enum: ALLOWED_TAGS,
    description: 'The destination of the trip',
  })
  destination: string;

  @ApiPropertyOptional({
    enum: ALLOWED_QUERY_SORTING,
    description: 'The sorting column',
  })
  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_QUERY_SORTING)
  sort_by?: string;

  @ApiPropertyOptional({
    enum: ALLOWED_DIRECTION_SORTING,
    description: 'The sorting direction',
  })
  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_DIRECTION_SORTING)
  sort_direction?: string;
}

export class ExportQueryParamsDto {
  @ApiProperty({
    enum: ALLOWED_EXPORT_TYPES,
    description: 'The type of the export',
  })
  @IsString()
  @IsIn(ALLOWED_EXPORT_TYPES)
  type: string = 'csv';
}
