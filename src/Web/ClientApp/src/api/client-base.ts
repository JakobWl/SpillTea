import { AxiosRequestConfig } from "axios";
import authStorage from "../utils/authStorage";

export abstract class ClientBase {
  protected transformOptions(
    options: AxiosRequestConfig,
  ): Promise<AxiosRequestConfig> {

    return Promise.resolve(options);
  }
}
