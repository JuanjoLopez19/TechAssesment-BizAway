import { ApiProperty } from '@nestjs/swagger';

export class Entity<T> {
  @ApiProperty({ description: 'The data could be any type' })
  data: T;

  @ApiProperty({
    type: 'string',
    description: 'the message from the server',
  })
  message: string;
}

export class ErrorResponseEntity {
  @ApiProperty({ type: 'string', description: 'The error code' })
  error: string;

  @ApiProperty({ type: 'string', description: 'The error message' })
  message: string;

  @ApiProperty({ type: 'string', description: 'The error detail' })
  detail: string;
}

export class SuccessResponseEntity {
  @ApiProperty({ description: 'The message from the server' })
  data: Entity<object>;

  @ApiProperty({ type: 'integer', description: 'The status code' })
  code: number;
}
