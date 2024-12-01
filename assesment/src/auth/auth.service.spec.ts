import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { jwtRegEx } from 'src/test/utils/const';
import { TestModule } from 'src/test/utils/test.module';
import { UtilsService } from 'src/utils/utils.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

jest.useFakeTimers();

describe('AuthService', () => {
  let service: AuthService;
  let utilsService: UtilsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      providers: [AuthService, UtilsService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    utilsService = module.get<UtilsService>(UtilsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('Should return an error if the encryption failed', async () => {
      const registerDto = { username: 'testuser', password: 'testpassword' };

      utilsService.encryptPassword = jest.fn().mockImplementation(() => {
        return null;
      });

      const result = await service.register(registerDto);

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });

    it('should register a user succesfully', async () => {
      const registerDto = { username: 'testuser', password: 'testpassword' };
      const hashedPwd = 'hashedPassword';

      prismaService.users.create = jest
        .fn()
        .mockReturnValueOnce({ id: 1, username: registerDto.username });

      utilsService.encryptPassword = jest.fn().mockReturnValueOnce(hashedPwd);

      const result = await service.register(registerDto);

      expect(prismaService.users.create).toHaveBeenCalledTimes(1);
      expect(prismaService.users.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: hashedPwd,
        },
      });

      expect(prismaService.users.create).toHaveReturnedWith({
        id: 1,
        username: 'testuser',
      });

      expect(result.code).toBe(201);
      expect(result.data.message).toBe('User created successfully');
      expect(result.data.data).toEqual({});
    });

    it('should fail the register of a user', async () => {
      const registerDto = { username: 'testuser', password: 'testpassword' };
      const hashedPwd = 'hashedPassword';
      prismaService.users.create = jest.fn().mockReturnValueOnce(null);

      utilsService.encryptPassword = jest.fn().mockReturnValueOnce(hashedPwd);

      const result = await service.register(registerDto);

      expect(prismaService.users.create).toHaveBeenCalledTimes(1);
      expect(prismaService.users.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: hashedPwd,
        },
      });

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });

    it('Should return an error if any exception is thrown', async () => {
      const registerDto = { username: 'testuser', password: 'testpassword' };

      utilsService.encryptPassword = jest.fn().mockImplementation(() => {
        throw new Error();
      });

      const result = await service.register(registerDto);

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });
  });

  describe('Login', () => {
    const data: LoginDto = { username: 'testuser', password: 'testpassword' };
    it("Should return an error if the user doesn't exist", async () => {
      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Prisma.PrismaClientKnownRequestError('User not found', {
            code: 'P2025',
            clientVersion: '2.20.0',
          });
        });

      const result = await service.login(data);

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(result.code).toBe(404);
      expect(result.data.message).toBe('Not found.');
    });

    it("Should return an error if the user password doesn't match", async () => {
      prismaService.users.findUniqueOrThrow = jest.fn().mockReturnValueOnce({
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
      });

      utilsService.comparePwd = jest.fn().mockReturnValueOnce(false);

      const result = await service.login(data);

      expect(prismaService.users.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(result.code).toBe(401);
      expect(result.data.message).toBe('Unauthorized.');
    });

    it('Should return an error if any exception is thrown', async () => {
      prismaService.users.findUniqueOrThrow = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Mocked error in findUniqueOrThrow');
        });

      const result = await service.login(data);

      expect(result.code).toBe(500);
      expect(result.data.message).toBe('Internal server error.');
    });

    it('Should return the data if the loggin is successful', async () => {
      prismaService.users.findUniqueOrThrow = jest.fn().mockReturnValueOnce({
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
      });

      utilsService.comparePwd = jest.fn().mockReturnValueOnce(true);

      const result = await service.login(data);

      expect(result.code).toBe(200);
      expect(result.data.message).toBe('User logged in successfully');
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(jwtRegEx);
    });
  });
});
