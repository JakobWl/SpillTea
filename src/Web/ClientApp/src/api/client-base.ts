import { AxiosRequestConfig } from "axios";
import authStorage from "../utils/authStorage";

export abstract class ClientBase {
  protected transformOptions(
    options: AxiosRequestConfig,
  ): Promise<AxiosRequestConfig> {
    const token = authStorage.getToken();

    if (token) {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };

      return Promise.resolve({
        ...options,
        headers,
      });
    }

    return Promise.resolve(options);
  }
}
