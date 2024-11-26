import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsString()
  @ValidateIf((obj, value) => !obj.email || value)
  @ApiProperty({ description: 'The username of the user' })
  username?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The password of the user' })
  password: string;
}
