import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ErrorResponseEntity, SuccessResponseEntity } from 'src/common/entity';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SuccessResponseAuth } from './entity/auth.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigurationService,
  ) {}
  @Post('login')
  @ApiOkResponse({
    description: 'User logged in successfully',
    type: SuccessResponseAuth,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ErrorResponseEntity,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseEntity,
  })
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.login(data);

    if (response.token)
      res.cookie(this.configService.crypto.cookieName, response.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

    res
      .status(response.code)
      .json({ data: response.data, code: response.code });
  }

  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseEntity,
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: SuccessResponseEntity,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ErrorResponseEntity,
  })
  @ApiConflictResponse({
    description: 'Username already in use',
    type: ErrorResponseEntity,
  })
  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }
}
