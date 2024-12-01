import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestService {
  constructor(private readonly httpService: HttpService) {}

  async getAll<T>(destination: string, origin: string, path: string) {
    const query = `${path}?origin=${origin}&destination=${destination}`;
    return this.httpService.axiosRef.get<T>(query);
  }

  async getById<T>(id: string, path: string) {
    const query = `${path}/${id}`;
    return this.httpService.axiosRef.get<T>(query);
  }
}
