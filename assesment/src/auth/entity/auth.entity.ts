import { ApiProperty } from '@nestjs/swagger';
import { Users } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { Entity } from 'src/common/entity';

export class UserEntity implements Users {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    type: 'integer',
    example: 1,
    description: 'The id of the user',
  })
  id: number;

  @ApiProperty({
    type: 'string',
    example: 'John Doe',
    description: 'The name of the user',
  })
  username: string;

  @ApiProperty({
    type: 'string',
    example: '2021-08-02T00:00:00.000Z',
    description: 'The date the user was created',
  })
  created_at: Date;

  @ApiProperty({
    type: 'string',
    example: '2021-08-02T00:00:00.000Z',
    description: 'The date the user was last updated',
  })
  updated_at: Date;

  @Exclude()
  password: string;
}

export class UserResponse extends Entity<UserEntity> {
  @ApiProperty({ type: UserEntity, description: 'The user data' })
  declare data: UserEntity;
}
export class SuccessResponseAuth {
  @ApiProperty({ type: UserResponse, description: 'The user data' })
  data: UserResponse;

  @ApiProperty({
    type: 'integer',
    example: 200,
    description: 'The status code',
  })
  code: number;
}
