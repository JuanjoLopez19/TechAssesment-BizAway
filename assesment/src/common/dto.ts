import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ALLOWED_DIRECTION_SORTING, ALLOWED_SORTING } from './const';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Actual page number',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Results per page',
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'sorting direction',
    example: 'asc',
    enum: ALLOWED_DIRECTION_SORTING,
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_DIRECTION_SORTING)
  sort?: string;

  @ApiPropertyOptional({
    description: 'column to sort by',
    example: 'fastest',
    enum: ALLOWED_SORTING,
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORTING)
  sorted_by?: string;
}
