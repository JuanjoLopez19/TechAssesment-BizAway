import axios, { Axios } from 'axios';
export class HttpCommon {
  private readonly url: string;
  private readonly client: Axios;
  private readonly token: string;
  private readonly path: string;
  constructor(url: string, token: string, path: string) {
    this.url = url;
    this.token = token;
    this.path = path;
    this.client = axios.create({
      baseURL: this.url,
    });

    this.client.interceptors.request.use((config) => {
      config.headers.set('x-api-key', this.token);
      return config;
    });
  }

  async getAll<T>(destination: string, origin: string) {
    const query = `${this.path}?origin=${origin}&destination=${destination}`;
    return this.client.get<T>(query);
  }

  async getById<T>(id: string) {
    const query = `${this.path}/${id}`;
    return this.client.get<T>(query);
  }
}
