import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  LoggerService,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from './utils/utils.service';

import * as winston from 'winston';
import { WinstonModule, utilities } from 'nest-winston';

import * as fs from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as http from 'http';
import { ConfigurationService } from './configuration/configuration.service';

async function bootstrap() {
  const config = new ConfigService();
  const httpsEnabled = config.get('HTTPS_ENABLED') === 'true';
  const app = await NestFactory.create(AppModule, {
    httpsOptions: configureHttps(config, httpsEnabled),
    logger: configureLogger(config),
  });

  app.useGlobalPipes(buildValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  const configurationService =
    app.get<ConfigurationService>(ConfigurationService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configurationService.app.name)
    .setDescription('This is the OpenAPI documentation for the assesment API')
    .setVersion('1.0.0')
    .addCookieAuth(configurationService.crypto.cookieName)
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, documentFactory());
  if (httpsEnabled) {
    console.log('redirecting to https');
    http
      .createServer((req, res) => {
        const httpsPort = configurationService.http.httpsHostPort;
        const Location = `https://${req.headers.host.split(':')[0]}:${httpsPort}${req.url}`;
        console.log(Location);
        res.writeHead(301, {
          Location,
        });
        res.end();
      })
      .listen(configurationService.http.httpPort);
  }
  await app.listen(configurePort(configurationService, httpsEnabled));
}

const buildValidationPipe = () => {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      const getPrettyClassValidatorErrors = (
        validationErrors: ValidationError[],
        parentProperty = '',
      ): Array<{ property: string; errors: string[] }> => {
        const errors: Array<{ property: string; errors: Array<string> }> = [];

        const getValidationErrorsRecursively = (
          validationErrors: ValidationError[],
          parentProperty = '',
        ) => {
          for (const error of validationErrors) {
            const propertyPath = parentProperty
              ? `${parentProperty}.${error.property}`
              : error.property;

            if (error.constraints) {
              errors.push({
                property: propertyPath,
                errors: Object.values(error.constraints),
              });
            }

            if (error.children?.length) {
              getValidationErrorsRecursively(error.children, propertyPath);
            }
          }
        };

        getValidationErrorsRecursively(validationErrors, parentProperty);

        return errors;
      };

      const errors = getPrettyClassValidatorErrors(validationErrors);

      return new BadRequestException(
        new UtilsService(
          new ConfigurationService(new ConfigService()),
        ).buildErrorResponse(
          'VALIDATION_ERROR',
          'Validation error',
          JSON.stringify(errors),
        ),
      );
    },
  });
};

const configureHttps = (config: ConfigService, sslEnabled: boolean) => {
  if (sslEnabled) {
    if (
      fs.existsSync(`${process.cwd()}${config.get('HTTPS_KEY') || ''}`) &&
      fs.existsSync(`${process.cwd()}${config.get('HTTPS_CERT') || ''}`)
    ) {
      return {
        key: fs.readFileSync(
          `${process.cwd()}${config.get('HTTPS_KEY') || ''}`,
        ),
        cert: fs.readFileSync(
          `${process.cwd()}${config.get('HTTPS_CERT') || ''}`,
        ),
        ca: config.get('HTTPS_CA')
          ? [fs.readFileSync(`${process.cwd()}${config.get('HTTPS_CA') || ''}`)]
          : [],
      };
    }
  } else return undefined;
};

const configureLogger = (config: ConfigService): LoggerService => {
  return WinstonModule.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: 'src/logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'src/logs/combined.log',
        level: 'info',
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          utilities.format.nestLike(config.get('APP_NAME') || 'assesment', {
            colors: true,
            prettyPrint: true,
            appName: true,
          }),
        ),
      }),
    ],
  });
};

const configurePort = (config: ConfigurationService, sslEnabled: boolean) => {
  console.log(sslEnabled ? config.http.httpsPort : config.http.httpPort);
  return sslEnabled ? config.http.httpsPort : config.http.httpPort;
};

bootstrap();
