import { Injectable, Logger } from '@nestjs/common';
import * as bc from 'bcryptjs';
import { PaginationLinks } from 'src/common/interfaces';
import { errorResponse, successResponse } from 'src/common/types';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class UtilsService {
  private logger = new Logger(UtilsService.name);
  constructor(private config: ConfigurationService) {}

  /**
   * Builds an error response object.
   *
   * @param error - The error code or identifier.
   * @param message - A brief message describing the error.
   * @param detail - Additional details about the error.
   * @returns An object containing the error, message, and detail.
   */
  public buildErrorResponse(error: string, message: string, detail: string) {
    return { error, message, detail } as errorResponse;
  }

  /**
   * Builds a success response object.
   *
   * @param data - The data to be included in the response.
   * @param message - A message describing the success.
   * @param links - Optional pagination links to be included in the response.
   * @returns A success response object containing the data, message, and optionally pagination links.
   */
  public buildSuccessResponse(
    data: any,
    message: string,
    links: PaginationLinks | null = null,
  ) {
    return links
      ? ({ data, message, links } as successResponse)
      : ({ data, message } as successResponse);
  }

  /**
   * Builds pagination links for a given route.
   *
   * @param {string} route - The base route for the pagination links.
   * @param {number} page - The current page number.
   * @param {number} limit - The number of items per page.
   * @param {number} total - The total number of pages.
   * @returns {PaginationLinks} An object containing pagination links.
   *
   * @property {string} self - The link to the current page.
   * @property {string} first - The link to the first page.
   * @property {string | null} prev - The link to the previous page, or null if on the first page.
   * @property {string | null} next - The link to the next page, or null if on the last page.
   * @property {string} last - The link to the last page.
   * @property {number} totalPages - The total number of pages.
   */
  public buildPaginationLinks(
    route: string,
    page: number,
    limit: number,
    total: number,
  ): PaginationLinks {
    return {
      self: `${route}?page=${page}&limit=${limit}`,
      first: `${route}?page=1&limit=${limit}`,
      prev: page > 1 ? `${route}?page=${page - 1}&limit=${limit}` : null,
      next:
        page + 1 <= total ? `${route}?page=${page + 1}&limit=${limit}` : null,
      last: `${route}?page=${total}&limit=${limit}`,
      totalPages: total,
    } as PaginationLinks;
  }

  /**
   * Encrypts a given password using bcrypt.
   *
   * @param pwd - The plain text password to be encrypted.
   * @returns A promise that resolves to the hashed password, or null if an error occurs.
   * @throws Logs an error if the encryption process fails.
   */
  public async encryptPassword(pwd: string) {
    try {
      const salt = await bc.genSalt(this.config.crypto.saltRounds);
      const hash = await bc.hash(pwd, salt);
      return hash;
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  /**
   * Compares a plain text password with a hashed password.
   *
   * @param pwd - The plain text password to compare.
   * @param hash - The hashed password to compare against.
   * @returns A promise that resolves to a boolean indicating whether the passwords match.
   */
  comparePwd(pwd: string, hash: string) {
    return bc.compare(pwd, hash);
  }

  /**
   * Checks if all specified keys exist in the given object and that their values are not null, undefined, or empty strings.
   *
   * @param obj - The object to check.
   * @param keys - An array of keys to check for in the object.
   * @returns A boolean indicating whether all specified keys exist in the object and have non-null, non-undefined, and non-empty string values.
   */
  keysChecker(obj: { [key: string]: any }, keys: string[]) {
    return keys.every((key: string) => {
      return (
        Object.keys(obj).indexOf(key) !== -1 &&
        obj[key] !== null &&
        obj[key] !== undefined &&
        obj[key] !== ''
      );
    });
  }
}
