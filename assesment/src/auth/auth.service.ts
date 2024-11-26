import { Injectable, Logger } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import globalMessages from 'src/common/messages';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { UtilsService } from 'src/utils/utils.service';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);
  constructor(
    private readonly utils: UtilsService,
    private readonly configService: ConfigurationService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  /**
   * Authenticates a user with the provided login credentials.
   *
   * @param {LoginDto} data - The login data transfer object containing the username and password.
   * @returns {Promise<{data: any, code: number, token?: string}>} - A promise that resolves to an object containing the response data, status code, and optionally a JWT token.
   *
   * @throws {Prisma.PrismaClientKnownRequestError} - If the user is not found in the database.
   */
  async login(
    data: LoginDto,
  ): Promise<{ data: any; code: number; token?: string }> {
    try {
      const { username, password } = data;
      const user = await this.prismaService.users.findUniqueOrThrow({
        where: { username },
      });

      if (!(await this.utils.comparePwd(password, user.password))) {
        return {
          data: this.utils.buildErrorResponse(
            'WRONG_CREDENTIALS',
            globalMessages[401].UNAUTHORIZED.SHORT,
            globalMessages[401].UNAUTHORIZED.LONG,
          ),
          code: 401,
        };
      }

      return {
        data: this.utils.buildSuccessResponse(
          {
            id: user.id,
            username: user.username,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
          'User logged in successfully',
        ),
        code: 200,
        token: this.jwtService.sign({ id: user.id }),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          data: this.utils.buildErrorResponse(
            'USER_NOT_FOUND',
            globalMessages[404].NOT_FOUND.SHORT,
            globalMessages[404].NOT_FOUND.LONG,
          ),
          code: 404,
        };
      }
      this.logger.error(e);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }

  /**
   * Registers a new user with the provided data.
   *
   * @param {RegisterDto} data - The registration data containing username and password.
   * @returns {Promise<{ data: any; code: number }>} - A promise that resolves to an object containing the response data and status code.
   *
   * @throws {Error} - Throws an error if the registration process fails.
   */
  async register(data: RegisterDto): Promise<{ data: any; code: number }> {
    try {
      const { username, password } = data;
      const hashedPassword = await this.utils.encryptPassword(password);
      if (!hashedPassword) {
        return {
          data: this.utils.buildErrorResponse(
            'INTERNAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
          code: 500,
        };
      }
      const newUser: Prisma.UsersCreateInput = {
        username,
        password: hashedPassword,
      };

      const user = await this.prismaService.users.create({ data: newUser });

      if (!user) {
        return {
          data: this.utils.buildErrorResponse(
            'INTERNAL_ERROR',
            globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
            globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
          ),
          code: 500,
        };
      }

      return {
        data: this.utils.buildSuccessResponse({}, 'User created successfully'),
        code: 201,
      };
    } catch (e) {
      this.logger.error(e);
      return {
        data: this.utils.buildErrorResponse(
          'INTERNAL_ERROR',
          globalMessages[500].INTERNAL_SERVER_ERROR.SHORT,
          globalMessages[500].INTERNAL_SERVER_ERROR.LONG,
        ),
        code: 500,
      };
    }
  }
}
